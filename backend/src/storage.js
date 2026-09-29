'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Storage Root Resolver:
 * Resolves MEDIA_ROOT from environment variable or defaults to backend/assets.
 * If MEDIA_ROOT is relative, it is resolved relative to the backend root directory.
 */
function resolveMediaRoot() {
  const envVal = process.env.MEDIA_ROOT;
  const defaultPath = path.resolve(__dirname, '..', 'assets');
  if (!envVal || !envVal.trim()) {
    return defaultPath;
  }
  const trimmed = envVal.trim();
  const candidate = path.isAbsolute(trimmed) ? path.normalize(trimmed) : path.resolve(__dirname, '..', trimmed);
  if (!fs.existsSync(candidate)) {
    console.warn(`[storage] Configured MEDIA_ROOT does not exist ('${candidate}'). Falling back to default: '${defaultPath}'`);
    return defaultPath;
  }
  return candidate;
}

const MEDIA_ROOT = resolveMediaRoot();

/**
 * The four fixed storage subdirectories:
 * camps: All general website CMS images (HERO, SITE)
 * teams: Camp-team photos from all camps + fixed website-team portraits
 * sponsors: Sponsor/partner images from all camps
 * gallery: Photos and covers for all global gallery albums
 */
const VALID_FOLDERS = ['camps', 'teams', 'sponsors', 'gallery'];

/**
 * Logical media kind to flat folder mapping:
 * HERO -> camps
 * SITE -> camps
 * TEAM -> teams
 * SPONSOR -> sponsors
 * GALLERY -> gallery
 */
const KIND_FOLDER_MAP = {
  HERO: 'camps',
  SITE: 'camps',
  TEAM: 'teams',
  SPONSOR: 'sponsors',
  GALLERY: 'gallery'
};

/**
 * Fixed portraits in backend/assets/teams/ reserved for the permanent Website Team roster.
 * Every upload, replacement, deletion, and cleanup path must strictly exclude them.
 */
const RESERVED_PORTRAITS = Object.freeze([
  'aryan-sharma.jpg',
  'bharat-dhakad.jpg',
  'chetan-yadav.jpg',
  'rahul-saini.jpg'
]);

/**
 * Checks if a filename is one of the deployment-owned permanent website team portraits.
 * @param {string} filename
 * @returns {boolean}
 */
function isReservedPortrait(filename) {
  if (!filename) return false;
  const basename = path.basename(filename).toLowerCase();
  return RESERVED_PORTRAITS.includes(basename);
}

/**
 * Maps a logical media kind to its target folder name.
 * @param {string} kind
 * @returns {string} folder name ('camps' | 'teams' | 'sponsors' | 'gallery')
 */
function getFolderForKind(kind) {
  const upper = (kind || '').toUpperCase();
  const folder = KIND_FOLDER_MAP[upper];
  if (!folder) {
    throw new Error(`Invalid media kind '${kind}'. Allowed kinds: ${Object.keys(KIND_FOLDER_MAP).join(', ')}`);
  }
  return folder;
}

/**
 * Verifies that the storage root and the four fixed subdirectories exist and are writable
 * WITHOUT attempting to create any directories.
 * Returns an object with health status and details.
 */
function checkStorageHealth() {
  const rootExists = fs.existsSync(MEDIA_ROOT);
  if (!rootExists) {
    const err = new Error(`Storage root directory does not exist: ${MEDIA_ROOT}`);
    err.code = 'ENOENT';
    throw err;
  }

  const results = {};
  for (const folder of VALID_FOLDERS) {
    const dirPath = path.join(MEDIA_ROOT, folder);
    if (!fs.existsSync(dirPath)) {
      const err = new Error(`Required storage folder does not exist: ${dirPath}. Folders must be pre-provisioned.`);
      err.code = 'ENOENT';
      throw err;
    }
    // Verify write permission using fs.accessSync
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
      results[folder] = { ok: true, path: dirPath };
    } catch (accessErr) {
      const err = new Error(`Storage folder is not writable: ${dirPath} (${accessErr.code || accessErr.message})`);
      err.code = accessErr.code || 'EACCES';
      throw err;
    }
  }

  return { ok: true, root: MEDIA_ROOT, folders: results };
}

/**
 * Ensures that a proposed subfolder name is strictly one of the 4 allowed folders.
 * Prevents directory traversal.
 * @param {string} folder
 * @returns {string} validated folder
 */
function sanitizeFolder(folder) {
  const clean = (folder || '').toLowerCase().trim();
  if (!VALID_FOLDERS.includes(clean)) {
    throw new Error(`Invalid storage folder '${folder}'. Allowed: ${VALID_FOLDERS.join(', ')}`);
  }
  return clean;
}

/**
 * Writes an uploaded image buffer to disk using exclusive creation (flag: 'wx')
 * to guarantee no collision or accidental overwrite.
 *
 * @param {string} folder 'camps' | 'teams' | 'sponsors' | 'gallery'
 * @param {Buffer} buffer File buffer
 * @param {string} extension '.jpg' | '.png' | '.webp'
 * @returns {{ filename: string, relativePath: string, absolutePath: string, sha256: Buffer, byteSize: number }}
 */
function saveFileExclusively(folder, buffer, extension) {
  const cleanFolder = sanitizeFolder(folder);

  const cleanExt = (extension.startsWith('.') ? extension : `.${extension}`).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(cleanExt)) {
    throw new Error(`Unsupported file extension: ${cleanExt}`);
  }

  // Pre-check folder accessibility without mkdir
  const dirPath = path.join(MEDIA_ROOT, cleanFolder);
  if (!fs.existsSync(dirPath)) {
    const err = new Error(`Storage directory missing: ${dirPath}. Folders must be pre-provisioned.`);
    err.code = 'ENOENT';
    throw err;
  }

  try {
    fs.accessSync(dirPath, fs.constants.W_OK);
  } catch (accErr) {
    const err = new Error(`Storage directory is not writable: ${dirPath} (${accErr.code || accErr.message})`);
    err.code = accErr.code || 'EACCES';
    throw err;
  }

  // Generate collision-resistant UUID filename
  let filename;
  let absolutePath;
  let attempts = 0;
  do {
    const fileId = crypto.randomUUID();
    filename = `${fileId}${cleanExt === '.jpeg' ? '.jpg' : cleanExt}`;
    // Exclude reserved portrait filenames
    if (cleanFolder === 'teams' && isReservedPortrait(filename)) {
      attempts++;
      continue;
    }
    absolutePath = path.join(dirPath, filename);
    attempts++;
  } while (fs.existsSync(absolutePath) && attempts < 10);

  // Exclusive file creation write
  fs.writeFileSync(absolutePath, buffer, { flag: 'wx' });

  const sha256 = crypto.createHash('sha256').update(buffer).digest();
  const relativePath = `${cleanFolder}/${filename}`;

  return {
    filename,
    relativePath,
    absolutePath,
    sha256,
    byteSize: buffer.length
  };
}

/**
 * Converts a stored relative_path (e.g. 'teams/uuid.jpg') to an absolute filesystem path.
 * @param {string} relativePath
 * @returns {string} absolute path
 */
function resolveAbsolutePath(relativePath) {
  if (!relativePath) return null;
  // Prevent directory traversal
  const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  return path.join(MEDIA_ROOT, normalized);
}

/**
 * Returns the public URL for a relative path.
 * @param {string} relativePath
 * @returns {string} URL string, e.g. '/media/teams/uuid.jpg'
 */
function toPublicUrl(relativePath) {
  if (!relativePath) return null;
  const clean = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `/media/${clean}`;
}

module.exports = {
  MEDIA_ROOT,
  VALID_FOLDERS,
  KIND_FOLDER_MAP,
  RESERVED_PORTRAITS,
  isReservedPortrait,
  getFolderForKind,
  checkStorageHealth,
  sanitizeFolder,
  saveFileExclusively,
  resolveAbsolutePath,
  toPublicUrl
};
