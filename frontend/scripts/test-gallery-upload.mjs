import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import { adminService } from '../src/admin/services/adminService.js';

// Exercise the actual gallery handler with the real upload response adapter.
const source = fs.readFileSync(new URL('../src/admin/components/GalleryAdminManager.jsx', import.meta.url), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
let handler;
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && node.id?.name === 'runBulkUpload') handler = node.init;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);
assert.ok(handler);

for (const scenario of ['success', 'upload-error', 'attach-error']) {
  let state = { files: [new File(['image'], 'test.webp', { type: 'image/webp' })], uploading: false, done: 0, failed: 0, results: [] };
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/upload') {
      assert.equal(options.body.get('album_id'), '7');
      assert.equal(options.body.get('kind'), 'GALLERY');
      return Response.json(scenario === 'upload-error'
        ? { ok: false, message: 'Invalid image dimensions.' }
        : { ok: true, data: { asset_id: 42, url: '/media/gallery/test.webp' } }, { status: scenario === 'upload-error' ? 400 : 200 });
    }
    assert.equal(url, '/api/admin/gallery/albums/7/photos');
    assert.equal(JSON.parse(options.body).asset_id, 42);
    return Response.json(scenario === 'attach-error'
      ? { ok: false, message: 'Could not attach photo.' }
      : { ok: true }, { status: scenario === 'attach-error' ? 400 : 200 });
  };
  const scope = {
    bulkUpload: state, selectedAlbumId: 7, selectedAlbum: { title: 'Test Album' }, selectedCategory: 'All', adminService,
    setBulkUpload: update => { state = update(state); },
    fetchAlbumPhotos: async () => {}, fetchSelectedAlbumDetails: async () => {},
    setAlbums: update => update([{ id: 7, photo_count: 0 }]), Swal: { fire: () => {} }
  };
  const run = new Function(...Object.keys(scope), `return (${source.slice(handler.start, handler.end)});`)(...Object.values(scope));
  await run();
  assert.equal(state.done, 1);
  assert.equal(state.uploading, false);
  assert.equal(state.failed, scenario === 'success' ? 0 : 1);
  assert.equal(calls.length, scenario === 'upload-error' ? 1 : 2);
  if (scenario === 'upload-error') assert.equal(state.results[0].message, 'Invalid image dimensions.');
  if (scenario === 'attach-error') assert.equal(state.results[0].message, 'Could not attach photo.');
}
console.log('Gallery checks passed: successful upload attaches the returned asset, and upload/attachment errors remain visible.');
