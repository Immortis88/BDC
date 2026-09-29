'use strict';
const router = require('express').Router();
const { pool } = require('../db');
const storage = require('../storage');
const v = require('../galleryValidation');
const route = fn => async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
// A hidden photo must never surface as an album cover. Fallback uses a visible photo.
const cover = `COALESCE(
 (SELECT m.relative_path FROM media_assets m JOIN gallery_photos p ON p.asset_id=m.id
  WHERE m.id=a.cover_asset_id AND p.album_id=a.id AND p.is_visible=1 LIMIT 1),
 (SELECT m.relative_path FROM gallery_photos p JOIN media_assets m ON m.id=p.asset_id
  WHERE p.album_id=a.id AND p.is_visible=1 ORDER BY p.sort_order,p.id LIMIT 1)) cover_relative_path`;
const albumFields = `a.id,a.title,a.description,a.camp_year,a.camp_date,a.sort_order,${cover},
 (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id=a.id AND p.is_visible=1) photo_count`;
function albumDTO(a){const {cover_relative_path,...rest}=a;return {...rest,id:Number(a.id),cover_url:storage.toPublicUrl(cover_relative_path)};}
function photoDTO(p){const {relative_path,...rest}=p;const url=storage.toPublicUrl(relative_path);return {...rest,id:Number(p.id),photo_url:url,photoUrl:url,image_url:url};}
router.get('/gallery/albums',route(async(req,res)=>{
 const {page,limit,offset}=v.pagination(req.query);
 const [[{total}]]=await pool.query('SELECT COUNT(*) total FROM gallery_albums WHERE is_published=1');
 const [rows]=await pool.query(`SELECT ${albumFields} FROM gallery_albums a WHERE a.is_published=1 ORDER BY a.sort_order,a.id DESC LIMIT ? OFFSET ?`,[limit,offset]);
 res.json({ok:true,success:true,data:{albums:rows.map(albumDTO),total,page,limit,totalPages:Math.ceil(total/limit)}});
}));
router.get('/gallery/albums/:id',route(async(req,res)=>{
 const id=v.id(req.params.id,'album ID');const {page,limit,offset}=v.pagination(req.query,200);
 const [[a]]=await pool.query(`SELECT ${albumFields} FROM gallery_albums a WHERE a.id=? AND a.is_published=1`,[id]);
 if(!a)v.fail('Published gallery album not found.',404);
 const name=v.text(req.query.category,'Category',100);
 const [cats]=await pool.query(`SELECT c.name FROM gallery_categories c WHERE c.album_id=? AND EXISTS
  (SELECT 1 FROM gallery_photos p WHERE p.album_id=c.album_id AND p.category=c.name AND p.is_visible=1)
  ORDER BY c.sort_order,c.name,c.id`,[id]);
 const filter=name&&name!=='All'?' AND p.category=?':'';
 const params=[id,...(filter?[name]:[])];
 const [[{total}]]=await pool.query(`SELECT COUNT(*) total FROM gallery_photos p WHERE p.album_id=? AND p.is_visible=1${filter}`,params);
 const [photos]=await pool.query(`SELECT p.id,p.category,p.alt_text,p.caption,p.sort_order,m.relative_path
  FROM gallery_photos p JOIN media_assets m ON m.id=p.asset_id JOIN gallery_albums a ON a.id=p.album_id
  WHERE p.album_id=? AND p.is_visible=1 AND a.is_published=1${filter} ORDER BY p.sort_order,p.id LIMIT ? OFFSET ?`,[...params,limit,offset]);
 res.json({ok:true,success:true,data:{album:albumDTO(a),categories:cats.map(c=>c.name),photos:photos.map(photoDTO),total,page,limit,totalPages:Math.ceil(total/limit)}});
}));
// Homepage requests a bounded global feed, never a live-camp-dependent full album dump.
router.get('/gallery',route(async(req,res)=>{
 const [photos]=await pool.query(`SELECT p.id,p.category,p.alt_text,p.caption,m.relative_path
  FROM gallery_photos p JOIN gallery_albums a ON a.id=p.album_id JOIN media_assets m ON m.id=p.asset_id
  WHERE a.is_published=1 AND p.is_visible=1 ORDER BY a.sort_order,a.id DESC,p.sort_order,p.id LIMIT 16`);
 const carouselPhotos=photos.map(photoDTO);
 res.json({ok:true,success:true,data:{carouselPhotos,photos:carouselPhotos}});
}));
module.exports=router;
