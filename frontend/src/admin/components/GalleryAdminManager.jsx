import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  Tag,
  Search,
  RefreshCw,
  AlertTriangle,
  FolderPlus,
  Layers,
  Calendar,
  Check,
  X,
  Upload,
  ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';
import { adminService } from '../services/adminService.js';
import ImagePickerModal from './ImagePickerModal.jsx';
import LoadingState from './LoadingState.jsx';

/**
 * Global Gallery Album & Photo/Category Management UI
 * Integrated directly into Website CMS under the "GALLERY" tab.
 */
export default function GalleryAdminManager({ camps = [] }) {
  // ── Album List State ────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [albumSearch, setAlbumSearch] = useState('');

  // ── Selected Album (Nested Photo/Category View) ──────────────────────────────
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loadingSelectedAlbum, setLoadingSelectedAlbum] = useState(false);

  // ── Nested Album Photos & Categories ────────────────────────────────────────
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [photoVisibilityFilter, setPhotoVisibilityFilter] = useState('ALL'); // 'ALL' | 'VISIBLE' | 'HIDDEN'
  const [photoPage, setPhotoPage] = useState(1);
  const PHOTOS_PER_PAGE = 24;

  // ── Modals State ────────────────────────────────────────────────────────────
  // Album Create/Edit Modal
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumModalMode, setAlbumModalMode] = useState('create'); // 'create' | 'edit'
  const [albumForm, setAlbumForm] = useState({
    id: null,
    title: '',
    description: '',
    camp_year: new Date().getFullYear(),
    camp_date: '',
    camp_id: '',
    cover_asset_id: null,
    is_published: false
  });
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Bulk Photo Upload State
  const bulkFileInputRef = useRef(null);
  const [bulkUpload, setBulkUpload] = useState({
    active: false,
    files: [],
    total: 0,
    done: 0,
    failed: 0,
    uploading: false,
    results: []
  });

  // Photo Details Edit Modal
  const [photoEditModalOpen, setPhotoEditModalOpen] = useState(false);
  const [photoEditForm, setPhotoEditForm] = useState({
    id: null,
    caption: '',
    alt_text: '',
    category: ''
  });
  const [savingPhotoEdit, setSavingPhotoEdit] = useState(false);

  // Inline Category Add / Edit State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // ── Fetch Albums ───────────────────────────────────────────────────────────
  const fetchAlbums = useCallback(async () => {
    setLoadingAlbums(true);
    try {
      const res = await adminService.gallery.albums.getAll({ limit: 100 });
      if (res.success && res.data?.albums) {
        setAlbums(res.data.albums);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load albums',
          text: res.message || 'Could not retrieve gallery albums.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      console.error('[GalleryAdminManager] fetchAlbums error:', err);
    } finally {
      setLoadingAlbums(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // ── Fetch Details & Children for Selected Album ─────────────────────────────
  const fetchSelectedAlbumDetails = useCallback(async (albumId) => {
    if (!albumId) return;
    setLoadingSelectedAlbum(true);
    try {
      const res = await adminService.gallery.albums.getById(albumId);
      if (res.success && res.data) {
        setSelectedAlbum(res.data);
      }
    } catch (err) {
      console.error('[GalleryAdminManager] fetchSelectedAlbumDetails error:', err);
    } finally {
      setLoadingSelectedAlbum(false);
    }
  }, []);

  const fetchAlbumPhotos = useCallback(async (albumId) => {
    if (!albumId) return;
    setLoadingPhotos(true);
    try {
      const res = await adminService.gallery.photos.getAll(albumId, { limit: 500 });
      if (res.success && res.data?.photos) {
        setPhotos(res.data.photos);
      }
    } catch (err) {
      console.error('[GalleryAdminManager] fetchAlbumPhotos error:', err);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const fetchAlbumCategories = useCallback(async (albumId) => {
    if (!albumId) return;
    setLoadingCategories(true);
    try {
      const res = await adminService.gallery.categories.getAll(albumId);
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('[GalleryAdminManager] fetchAlbumCategories error:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAlbumId) {
      fetchSelectedAlbumDetails(selectedAlbumId);
      fetchAlbumPhotos(selectedAlbumId);
      fetchAlbumCategories(selectedAlbumId);
      setSelectedCategory('All');
      setPhotoVisibilityFilter('ALL');
      setPhotoPage(1);
    } else {
      setSelectedAlbum(null);
      setPhotos([]);
      setCategories([]);
    }
  }, [selectedAlbumId, fetchSelectedAlbumDetails, fetchAlbumPhotos, fetchAlbumCategories]);

  // ── Filtered Albums List ───────────────────────────────────────────────────
  const filteredAlbums = useMemo(() => {
    if (!albumSearch.trim()) return albums;
    const q = albumSearch.toLowerCase().trim();
    return albums.filter((a) => {
      return (
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        String(a.camp_year || '').includes(q) ||
        a.camp_title?.toLowerCase().includes(q)
      );
    });
  }, [albums, albumSearch]);

  // ── Filtered Album Photos ──────────────────────────────────────────────────
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      if (photoVisibilityFilter === 'VISIBLE' && !p.is_visible) {
        return false;
      }
      if (photoVisibilityFilter === 'HIDDEN' && p.is_visible) {
        return false;
      }
      return true;
    });
  }, [photos, selectedCategory, photoVisibilityFilter]);

  const totalPhotoPages = Math.max(1, Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE));
  const paginatedPhotos = useMemo(() => {
    const start = (photoPage - 1) * PHOTOS_PER_PAGE;
    return filteredPhotos.slice(start, start + PHOTOS_PER_PAGE);
  }, [filteredPhotos, photoPage]);

  // ── Album Handlers ─────────────────────────────────────────────────────────
  const handleOpenCreateAlbum = () => {
    setAlbumModalMode('create');
    setAlbumForm({
      id: null,
      title: '',
      description: '',
      camp_year: new Date().getFullYear(),
      camp_date: '',
      camp_id: camps[0]?.id || '',
      cover_asset_id: null,
      is_published: false
    });
    setAlbumModalOpen(true);
  };

  const handleOpenEditAlbum = (album) => {
    setAlbumModalMode('edit');
    setAlbumForm({
      id: album.id,
      title: album.title || '',
      description: album.description || '',
      camp_year: album.camp_year || '',
      camp_date: album.camp_date ? album.camp_date.split('T')[0] : '',
      camp_id: album.camp_id || '',
      cover_asset_id: album.cover_asset_id || null,
      is_published: Boolean(album.is_published)
    });
    setAlbumModalOpen(true);
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!albumForm.title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Title Required',
        text: 'Please enter a title for the album.',
        confirmButtonColor: '#B91C1C'
      });
      return;
    }

    setSavingAlbum(true);
    try {
      const payload = {
        title: albumForm.title.trim(),
        description: albumForm.description.trim() || null,
        camp_year: albumForm.camp_year ? Number(albumForm.camp_year) : null,
        camp_date: albumForm.camp_date || null,
        camp_id: albumForm.camp_id ? Number(albumForm.camp_id) : null,
        cover_asset_id: albumForm.cover_asset_id ? Number(albumForm.cover_asset_id) : null
      };

      if (albumModalMode === 'create') {
        const res = await adminService.gallery.albums.create(payload);
        if (res.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Album created (starts unpublished).',
            showConfirmButton: false,
            timer: 2000
          });
          setAlbumModalOpen(false);
          await fetchAlbums();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed to create album',
            text: res.message || 'Error occurred.',
            confirmButtonColor: '#B91C1C'
          });
        }
      } else {
        payload.is_published = albumForm.is_published;
        const res = await adminService.gallery.albums.update(albumForm.id, payload);
        if (res.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Album updated successfully.',
            showConfirmButton: false,
            timer: 1800
          });
          setAlbumModalOpen(false);
          await fetchAlbums();
          if (selectedAlbumId === albumForm.id) {
            await fetchSelectedAlbumDetails(albumForm.id);
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed to update album',
            text: res.message || 'Error occurred.',
            confirmButtonColor: '#B91C1C'
          });
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'An unexpected error occurred.',
        confirmButtonColor: '#B91C1C'
      });
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleToggleAlbumPublish = async (album, e) => {
    if (e) e.stopPropagation();
    const newStatus = !album.is_published;
    try {
      const res = await adminService.gallery.albums.update(album.id, { is_published: newStatus });
      if (res.success) {
        setAlbums((prev) =>
          prev.map((a) => (a.id === album.id ? { ...a, is_published: newStatus } : a))
        );
        if (selectedAlbum?.id === album.id) {
          setSelectedAlbum((prev) => ({ ...prev, is_published: newStatus }));
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: newStatus ? 'Album published live.' : 'Album moved to draft (hidden).',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: res.message || 'Could not update publication status.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        confirmButtonColor: '#B91C1C'
      });
    }
  };

  const handleDeleteAlbum = async (album, e) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Album?',
      text: `Are you sure you want to delete "${album.title}"? All photos in this album will be permanently deleted from the gallery.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete album',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#B91C1C',
      cancelButtonColor: '#64748B'
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.gallery.albums.delete(album.id);
        if (res.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Album deleted.',
            showConfirmButton: false,
            timer: 1800
          });
          if (selectedAlbumId === album.id) {
            setSelectedAlbumId(null);
          }
          await fetchAlbums();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: res.message || 'Could not delete album.',
            confirmButtonColor: '#B91C1C'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message,
          confirmButtonColor: '#B91C1C'
        });
      }
    }
  };

  const handleReorderAlbum = async (index, direction) => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= albums.length) return;

    const previousIds = albums.map((a) => a.id);
    const newAlbums = [...albums];
    const [moved] = newAlbums.splice(index, 1);
    newAlbums.splice(targetIndex, 0, moved);
    setAlbums(newAlbums);

    const orderedIds = newAlbums.map((a) => a.id);
    try {
      const res = await adminService.gallery.albums.reorder(orderedIds, previousIds);
      if (!res.success) {
        // Rollback
        await fetchAlbums();
      }
    } catch (err) {
      console.error('[GalleryAdminManager] Reorder album error:', err);
      await fetchAlbums();
    }
  };

  // ── Nested Category Handlers ───────────────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !selectedAlbumId) return;

    setAddingCategory(true);
    try {
      const res = await adminService.gallery.categories.create(selectedAlbumId, {
        name: newCategoryName.trim()
      });
      if (res.success) {
        setNewCategoryName('');
        await fetchAlbumCategories(selectedAlbumId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Category added.',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: res.message || 'Could not add category.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSaveRenameCategory = async (catId) => {
    if (!editingCategoryName.trim() || !selectedAlbumId) return;

    try {
      const res = await adminService.gallery.categories.update(selectedAlbumId, catId, {
        name: editingCategoryName.trim()
      });
      if (res.success) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        // Renaming updates photos transactionally in the backend, so reload both
        await fetchAlbumCategories(selectedAlbumId);
        await fetchAlbumPhotos(selectedAlbumId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Category renamed & photos updated.',
          showConfirmButton: false,
          timer: 1800
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Rename Failed',
          text: res.message || 'Could not rename category.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    }
  };

  const handleDeleteCategory = async (cat) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `Deleting "${cat.name}" will keep photos in this album, but they will become uncategorized.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete category',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#B91C1C',
      cancelButtonColor: '#64748B'
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.gallery.categories.delete(selectedAlbumId, cat.id);
        if (res.success) {
          if (selectedCategory === cat.name) {
            setSelectedCategory('All');
          }
          await fetchAlbumCategories(selectedAlbumId);
          await fetchAlbumPhotos(selectedAlbumId);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Category removed.',
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: res.message || 'Could not delete category.',
            confirmButtonColor: '#B91C1C'
          });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
      }
    }
  };

  const handleReorderCategory = async (index, direction) => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const previousIds = categories.map((c) => c.id);
    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);
    setCategories(newCategories);

    const orderedIds = newCategories.map((c) => c.id);
    try {
      const res = await adminService.gallery.categories.reorder(selectedAlbumId, orderedIds, previousIds);
      if (!res.success) {
        await fetchAlbumCategories(selectedAlbumId);
      }
    } catch (err) {
      console.error('[GalleryAdminManager] Reorder category error:', err);
      await fetchAlbumCategories(selectedAlbumId);
    }
  };

  // ── Nested Photo Handlers ──────────────────────────────────────────────────
  const handlePhotoUploaded = async (uploadRes) => {
    if (!uploadRes.asset_id || !selectedAlbumId) return;
    try {
      const payload = {
        asset_id: uploadRes.asset_id,
        category: selectedCategory !== 'All' ? selectedCategory : null,
        caption: '',
        alt_text: selectedAlbum?.title || 'BDC Camp Gallery Photo',
        is_visible: true
      };

      const res = await adminService.gallery.photos.create(selectedAlbumId, payload);
      if (res.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Photo added to album.',
          showConfirmButton: false,
          timer: 1800
        });
        await fetchAlbumPhotos(selectedAlbumId);
        await fetchSelectedAlbumDetails(selectedAlbumId);
        // Also update local album count in parent list
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === selectedAlbumId ? { ...a, photo_count: (a.photo_count || 0) + 1 } : a
          )
        );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Add Photo Failed',
          text: res.message || 'Could not attach photo to album.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    }
  };

  // ── Bulk Upload Handlers ───────────────────────────────────────────────────
  const openBulkUpload = () => {
    setBulkUpload({ active: true, files: [], total: 0, done: 0, failed: 0, uploading: false, results: [] });
    // Trigger file picker immediately
    setTimeout(() => bulkFileInputRef.current?.click(), 50);
  };

  const handleBulkFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBulkUpload((prev) => ({ ...prev, files, total: files.length, done: 0, failed: 0, results: [] }));
    // Reset input so same files can be re-selected if needed
    e.target.value = '';
  };

  const runBulkUpload = async () => {
    if (!bulkUpload.files.length || bulkUpload.uploading || !selectedAlbumId) return;
    setBulkUpload((prev) => ({ ...prev, uploading: true, done: 0, failed: 0, results: [] }));

    const results = [];
    for (const file of bulkUpload.files) {
      try {
        // Upload the file asset
        const uploadRes = await adminService.upload(file, {
          kind: 'GALLERY',
          albumId: selectedAlbumId,
          campId: selectedAlbum?.camp_id || undefined
        });

        if (!uploadRes.success || !uploadRes.asset_id) {
          throw new Error(uploadRes.message || 'Upload failed');
        }

        // Attach the asset to the album as a gallery photo
        const attachRes = await adminService.gallery.photos.create(selectedAlbumId, {
          asset_id: uploadRes.asset_id,
          category: selectedCategory !== 'All' ? selectedCategory : null,
          caption: '',
          alt_text: selectedAlbum?.title || 'BDC Camp Gallery Photo',
          is_visible: true
        });

        if (!attachRes.success) throw new Error(attachRes.message || 'Could not attach photo');

        results.push({ name: file.name, status: 'ok' });
        setBulkUpload((prev) => ({ ...prev, done: prev.done + 1, results: [...results] }));
      } catch (err) {
        results.push({ name: file.name, status: 'error', message: err.message });
        setBulkUpload((prev) => ({ ...prev, done: prev.done + 1, failed: prev.failed + 1, results: [...results] }));
      }
    }

    setBulkUpload((prev) => ({ ...prev, uploading: false }));

    // Refresh photo list and album metadata
    await fetchAlbumPhotos(selectedAlbumId);
    await fetchSelectedAlbumDetails(selectedAlbumId);
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === selectedAlbumId
          ? { ...a, photo_count: (a.photo_count || 0) + results.filter((r) => r.status === 'ok').length }
          : a
      )
    );

    const okCount = results.filter((r) => r.status === 'ok').length;
    const failCount = results.filter((r) => r.status === 'error').length;
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: failCount === 0 ? 'success' : okCount === 0 ? 'error' : 'warning',
      title: failCount === 0
        ? `${okCount} photo${okCount !== 1 ? 's' : ''} uploaded successfully.`
        : `${okCount} uploaded, ${failCount} failed.`,
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleTogglePhotoVisibility = async (photo) => {
    const newVisible = !photo.is_visible;
    try {
      const res = await adminService.gallery.photos.update(selectedAlbumId, photo.id, {
        is_visible: newVisible
      });
      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, is_visible: newVisible } : p))
        );
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: newVisible ? 'Photo set to visible.' : 'Photo hidden from public.',
          showConfirmButton: false,
          timer: 1200
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: res.message || 'Could not update visibility.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    }
  };

  const handleSetAlbumCover = async (photo) => {
    try {
      const res = await adminService.gallery.albums.update(selectedAlbumId, {
        cover_asset_id: photo.asset_id
      });
      if (res.success) {
        setSelectedAlbum((prev) => ({
          ...prev,
          cover_asset_id: photo.asset_id,
          cover_url: photo.photo_url || photo.image_url
        }));
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === selectedAlbumId
              ? {
                  ...a,
                  cover_asset_id: photo.asset_id,
                  cover_url: photo.photo_url || photo.image_url
                }
              : a
          )
        );
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Album cover set.',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: res.message || 'Could not set cover.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    }
  };

  const handleOpenEditPhotoModal = (photo) => {
    setPhotoEditForm({
      id: photo.id,
      caption: photo.caption || '',
      alt_text: photo.alt_text || '',
      category: photo.category || ''
    });
    setPhotoEditModalOpen(true);
  };

  const handleSavePhotoEdit = async (e) => {
    e.preventDefault();
    if (!photoEditForm.id || !selectedAlbumId) return;

    setSavingPhotoEdit(true);
    try {
      const payload = {
        caption: photoEditForm.caption.trim() || null,
        alt_text: photoEditForm.alt_text.trim() || null,
        category: photoEditForm.category.trim() || null
      };
      const res = await adminService.gallery.photos.update(
        selectedAlbumId,
        photoEditForm.id,
        payload
      );
      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoEditForm.id ? { ...p, ...payload } : p))
        );
        setPhotoEditModalOpen(false);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Photo details saved.',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: res.message || 'Could not update photo details.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
    } finally {
      setSavingPhotoEdit(false);
    }
  };

  const handleDeletePhoto = async (photo) => {
    const result = await Swal.fire({
      title: 'Delete Photo?',
      text: 'Are you sure you want to remove this photo from the album?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete photo',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#B91C1C',
      cancelButtonColor: '#64748B'
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.gallery.photos.delete(selectedAlbumId, photo.id);
        if (res.success) {
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          // If this was the cover, clear cover locally
          if (selectedAlbum?.cover_asset_id === photo.asset_id) {
            setSelectedAlbum((prev) => ({ ...prev, cover_asset_id: null, cover_url: null }));
          }
          setAlbums((prev) =>
            prev.map((a) =>
              a.id === selectedAlbumId
                ? {
                    ...a,
                    photo_count: Math.max(0, (a.photo_count || 1) - 1),
                    cover_asset_id:
                      a.cover_asset_id === photo.asset_id ? null : a.cover_asset_id,
                    cover_url: a.cover_asset_id === photo.asset_id ? null : a.cover_url
                  }
                : a
            )
          );
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Photo deleted.',
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: res.message || 'Could not delete photo.',
            confirmButtonColor: '#B91C1C'
          });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#B91C1C' });
      }
    }
  };

  const handleReorderPhoto = async (indexInFiltered, direction) => {
    const targetIndex = direction === 'UP' ? indexInFiltered - 1 : indexInFiltered + 1;
    if (targetIndex < 0 || targetIndex >= filteredPhotos.length) return;

    const previousIds = photos.map((p) => p.id);
    const photoToMove = filteredPhotos[indexInFiltered];
    const targetPhoto = filteredPhotos[targetIndex];

    const realIndexA = photos.findIndex((p) => p.id === photoToMove.id);
    const realIndexB = photos.findIndex((p) => p.id === targetPhoto.id);
    if (realIndexA === -1 || realIndexB === -1) return;

    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(realIndexA, 1);
    newPhotos.splice(realIndexB, 0, moved);
    setPhotos(newPhotos);

    const orderedIds = newPhotos.map((p) => p.id);
    try {
      const res = await adminService.gallery.photos.reorder(selectedAlbumId, orderedIds, previousIds);
      if (!res.success) {
        await fetchAlbumPhotos(selectedAlbumId);
      }
    } catch (err) {
      console.error('[GalleryAdminManager] Reorder photo error:', err);
      await fetchAlbumPhotos(selectedAlbumId);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER 1: NESTED ALBUM VIEW (MANAGE PHOTOS & CATEGORIES)
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedAlbumId) {
    if (loadingSelectedAlbum && !selectedAlbum) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <LoadingState message="Loading album details..." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedAlbumId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#B91C1C]" />
              <span>Back to All Albums</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {selectedAlbum?.title || 'Album Workspace'}
                </h2>
                {selectedAlbum?.is_published ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <EyeOff className="w-3 h-3" />
                    Draft / Hidden
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAlbum?.camp_year ? `Year: ${selectedAlbum.camp_year} • ` : ''}
                {selectedAlbum?.camp_title ? `Camp: ${selectedAlbum.camp_title} • ` : ''}
                {photos.length} photos total ({photos.filter((p) => p.is_visible).length} visible)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleToggleAlbumPublish(selectedAlbum)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                selectedAlbum?.is_published
                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {selectedAlbum?.is_published ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Unpublish Album</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Publish Album Live</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditAlbum(selectedAlbum)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={openBulkUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Photos</span>
            </button>
          </div>
        </div>

        {/* Categories Management Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B91C1C]" />
                Album Categories
              </h3>
              <p className="text-xs text-slate-500">
                Organize photos inside this album. Renaming a category automatically updates all associated photos.
              </p>
            </div>

            {/* Inline Add Category */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]"
              />
              <button
                type="submit"
                disabled={addingCategory || !newCategoryName.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#B91C1C] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Photos ({photos.length})
            </button>

            {categories.map((cat, idx) => {
              const count = photos.filter((p) => p.category === cat.name).length;
              const isSelected = selectedCategory === cat.name;
              const isEditing = editingCategoryId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 p-1 bg-white border border-[#B91C1C] rounded-xl shadow-xs"
                  >
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="px-2 py-0.5 text-xs text-slate-800 outline-hidden w-28"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRenameCategory(cat.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName('');
                      }}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
                    isSelected
                      ? 'bg-rose-50 border-[#B91C1C] text-[#B91C1C]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className="cursor-pointer"
                  >
                    {cat.name} ({count})
                  </button>

                  <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleReorderCategory(idx, 'UP')}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Move left"
                    >
                      <ArrowUp className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorderCategory(idx, 'DOWN')}
                      disabled={idx === categories.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Move right"
                    >
                      <ArrowDown className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setEditingCategoryName(cat.name);
                      }}
                      className="p-0.5 text-slate-400 hover:text-[#B91C1C] cursor-pointer"
                      title="Rename category"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-0.5 text-slate-400 hover:text-red-700 cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photos Header & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter Visibility:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPhotoVisibilityFilter('ALL');
                  setPhotoPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  photoVisibilityFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotoVisibilityFilter('VISIBLE');
                  setPhotoPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  photoVisibilityFilter === 'VISIBLE'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visible ({photos.filter((p) => p.is_visible).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotoVisibilityFilter('HIDDEN');
                  setPhotoPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  photoVisibilityFilter === 'HIDDEN'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hidden ({photos.filter((p) => !p.is_visible).length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing {filteredPhotos.length === 0 ? 0 : (photoPage - 1) * PHOTOS_PER_PAGE + 1}–
              {Math.min(photoPage * PHOTOS_PER_PAGE, filteredPhotos.length)} of {filteredPhotos.length}
            </span>
            <button
              type="button"
              onClick={() => fetchAlbumPhotos(selectedAlbumId)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Refresh photos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {loadingPhotos ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <LoadingState message="Loading photos..." />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#B91C1C] flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No photos found in this view</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {photos.length === 0
                ? 'This album is currently empty. Upload photos from past blood donation drives to showcase them.'
                : 'No photos match the selected category or visibility filter.'}
            </p>
            <button
              type="button"
              onClick={openBulkUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedPhotos.map((photo, pIdx) => {
              const globalIndex = (photoPage - 1) * PHOTOS_PER_PAGE + pIdx;
              const isCover = selectedAlbum?.cover_asset_id === photo.asset_id;

              return (
                <div
                  key={photo.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-2xs transition-all flex flex-col ${
                    photo.is_visible
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-slate-200/60 opacity-70 bg-slate-50/50'
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden group">
                    <img
                      src={photo.photo_url || photo.image_url}
                      alt={photo.alt_text || 'Album photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      {isCover && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 shadow-xs">
                          <Star className="w-3 h-3 fill-slate-900" />
                          Album Cover
                        </span>
                      )}
                      {photo.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white shadow-xs">
                          {photo.category}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePhotoVisibility(photo)}
                        className={`p-1.5 rounded-xl shadow-xs transition-colors cursor-pointer backdrop-blur-xs ${
                          photo.is_visible
                            ? 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                        title={photo.is_visible ? 'Visible on website (Click to hide)' : 'Hidden (Click to show)'}
                      >
                        {photo.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Hover Reorder Arrows */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleReorderPhoto(globalIndex, 'UP')}
                        disabled={globalIndex === 0}
                        className="p-1 text-white hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                        title="Move Up in Album"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderPhoto(globalIndex, 'DOWN')}
                        disabled={globalIndex === filteredPhotos.length - 1}
                        className="p-1 text-white hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                        title="Move Down in Album"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Info & Actions */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate" title={photo.caption || 'No caption'}>
                        {photo.caption || <span className="text-slate-400 italic">No caption</span>}
                      </p>
                      {photo.alt_text && (
                        <p className="text-[11px] text-slate-500 truncate" title={photo.alt_text}>
                          Alt: {photo.alt_text}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetAlbumCover(photo)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          <span>Make Cover</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Cover
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPhotoModal(photo)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Caption & Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPhotoPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPhotoPage((p) => Math.max(1, p - 1))}
              disabled={photoPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">
              Page {photoPage} of {totalPhotoPages}
            </span>
            <button
              type="button"
              onClick={() => setPhotoPage((p) => Math.min(totalPhotoPages, p + 1))}
              disabled={photoPage === totalPhotoPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {/* Hidden multi-file input for bulk upload */}
        <input
          ref={bulkFileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleBulkFilesSelected}
        />

        {/* Bulk Upload Panel */}
        {bulkUpload.active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Bulk Upload Photos
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Album: <strong>{selectedAlbum?.title || 'Selected Album'}</strong>
                    {selectedCategory !== 'All' && (
                      <> · Category: <strong>{selectedCategory}</strong></>
                    )}
                  </p>
                </div>
                {!bulkUpload.uploading && (
                  <button
                    type="button"
                    onClick={() => setBulkUpload((p) => ({ ...p, active: false }))}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* File selection area */}
                {!bulkUpload.uploading && bulkUpload.files.length === 0 && (
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#B91C1C] hover:bg-rose-50/30 transition-colors"
                    onClick={() => bulkFileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Click to select photos</p>
                    <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP · Multiple files supported · Max 10 MB each</p>
                  </div>
                )}

                {/* Selected files list */}
                {bulkUpload.files.length > 0 && (
                  <div className="space-y-3">
                    {/* Progress bar */}
                    {bulkUpload.uploading && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Uploading… {bulkUpload.done} / {bulkUpload.total}</span>
                          <span className="text-slate-400">{bulkUpload.failed > 0 ? `${bulkUpload.failed} failed` : ''}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-[#B91C1C] rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((bulkUpload.done / bulkUpload.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* File list */}
                    <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {bulkUpload.files.map((file, idx) => {
                        const result = bulkUpload.results[idx];
                        return (
                          <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                              <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                              {result?.status === 'error' && (
                                <p className="mt-1 text-xs text-red-700 break-words">{result.message}</p>
                              )}
                            </div>
                            <div className="shrink-0">
                              {!result ? (
                                bulkUpload.uploading && idx === bulkUpload.done ? (
                                  <span className="text-[11px] font-bold text-blue-600 animate-pulse">Uploading…</span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Pending</span>
                                )
                              ) : result.status === 'ok' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <Check className="w-3.5 h-3.5" /> Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700" title={result.message}>
                                  <X className="w-3.5 h-3.5" /> Failed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary after upload */}
                {!bulkUpload.uploading && bulkUpload.results.length > 0 && (
                  <div className={`p-3 rounded-xl text-xs font-bold text-center ${bulkUpload.failed === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                    {bulkUpload.failed === 0
                      ? `✓ All ${bulkUpload.total} photo${bulkUpload.total !== 1 ? 's' : ''} uploaded successfully.`
                      : `${bulkUpload.total - bulkUpload.failed} succeeded · ${bulkUpload.failed} failed`}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                {!bulkUpload.uploading && (
                  <>
                    {bulkUpload.results.length === 0 && (
                      <button
                        type="button"
                        onClick={() => bulkFileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        disabled={bulkUpload.uploading}
                      >
                        {bulkUpload.files.length > 0 ? `Change Files (${bulkUpload.files.length} selected)` : 'Select Files'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setBulkUpload((p) => ({ ...p, active: false }))}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {bulkUpload.results.length > 0 ? 'Close' : 'Cancel'}
                    </button>
                    {bulkUpload.files.length > 0 && bulkUpload.results.length === 0 && (
                      <button
                        type="button"
                        onClick={runBulkUpload}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload {bulkUpload.files.length} Photo{bulkUpload.files.length !== 1 ? 's' : ''}</span>
                      </button>
                    )}
                    {bulkUpload.results.length > 0 && bulkUpload.failed > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const failedFiles = bulkUpload.files.filter((_, i) => bulkUpload.results[i]?.status === 'error');
                          setBulkUpload((p) => ({ ...p, files: failedFiles, total: failedFiles.length, done: 0, failed: 0, results: [] }));
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Retry Failed ({bulkUpload.failed})
                      </button>
                    )}
                  </>
                )}
                {bulkUpload.uploading && (
                  <span className="text-xs text-slate-500 font-medium animate-pulse">Please wait, uploading…</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Edit Details Modal */}
        {photoEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <h3 className="text-sm font-bold text-slate-900">Edit Photo Details</h3>
                <button
                  type="button"
                  onClick={() => setPhotoEditModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePhotoEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Caption (Public display)
                  </label>
                  <input
                    type="text"
                    value={photoEditForm.caption}
                    onChange={(e) => setPhotoEditForm({ ...photoEditForm, caption: e.target.value })}
                    placeholder="e.g. Student volunteer assisting donors..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={photoEditForm.alt_text}
                    onChange={(e) => setPhotoEditForm({ ...photoEditForm, alt_text: e.target.value })}
                    placeholder="e.g. SKIT BDC blood donation drive photo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={photoEditForm.category}
                    onChange={(e) => setPhotoEditForm({ ...photoEditForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="">(None / Uncategorized)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPhotoEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPhotoEdit}
                    className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {savingPhotoEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER 2: GLOBAL ALBUMS LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#B91C1C]" />
              Global Photo Gallery Albums
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Manage published and draft photo albums displayed across SKIT BDC.
              Public visitors on <span className="font-semibold text-slate-700">/gallery</span> can browse published albums, and homepage carousel pulls photos from them.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateAlbum}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-md shadow-red-700/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Camp Gallery</span>
          </button>
        </div>

        {/* Informational Guidance Callout */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950">
              Publishing &amp; Storage Architecture:
            </p>
            <p className="text-amber-800 leading-relaxed">
              Newly created albums start <strong className="text-amber-950">unpublished by default</strong>. Once you add photos and verify them, toggle the album to <strong className="text-emerald-800">Published</strong> to make it visible on the public website. The homepage carousel automatically rotates visible photos from all published albums in their sort order.
            </p>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={albumSearch}
              onChange={(e) => setAlbumSearch(e.target.value)}
              placeholder="Search albums by title, year..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Total Albums: <strong className="text-slate-800">{albums.length}</strong> (
              <span className="text-emerald-700 font-semibold">{albums.filter((a) => a.is_published).length} published</span>,{' '}
              <span>{albums.filter((a) => !a.is_published).length} draft</span>)
            </span>
            <button
              type="button"
              onClick={fetchAlbums}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Refresh albums list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Albums Grid */}
      {loadingAlbums ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <LoadingState message="Loading gallery albums..." />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#B91C1C] flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Gallery Albums Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {albums.length === 0
              ? 'Click "Create Camp Gallery" above to create your first photo album for SKIT Blood Donation Campaign.'
              : 'No albums match your search query.'}
          </p>
          {albums.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreateAlbum}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Album</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlbums.map((album, idx) => (
            <div
              key={album.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
            >
              {/* Cover Image & Quick Badges */}
              <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-slate-50">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span className="text-[11px] font-medium">No cover set</span>
                  </div>
                )}

                {/* Status Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  {album.is_published ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/90 backdrop-blur-xs text-white shadow-xs">
                      <Check className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-xs text-slate-200 shadow-xs">
                      <EyeOff className="w-3 h-3" />
                      Draft / Hidden
                    </span>
                  )}
                  {album.camp_year && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
                      {album.camp_year}
                    </span>
                  )}
                </div>

                {/* Reorder Buttons Overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-900/70 backdrop-blur-xs p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleReorderAlbum(idx, 'UP')}
                    disabled={idx === 0}
                    className="p-1 text-white hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                    title="Move album up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorderAlbum(idx, 'DOWN')}
                    disabled={idx === filteredAlbums.length - 1}
                    className="p-1 text-white hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                    title="Move album down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Camp Connection Tag */}
                {album.camp_title && (
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/85 backdrop-blur-xs text-amber-300 shadow-xs">
                      Camp: {album.camp_title}
                    </span>
                  </div>
                )}
              </div>

              {/* Album Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1" title={album.title}>
                    {album.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                    {album.description || <span className="italic text-slate-400">No album description entered.</span>}
                  </p>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-[#B91C1C]" />
                      <strong>{album.photo_count || 0}</strong> Photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{album.category_count || 0}</strong> Categories
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-rose-300" />
                    <span>Manage Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleToggleAlbumPublish(album, e)}
                    className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      album.is_published
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={album.is_published ? 'Published (Click to hide)' : 'Draft (Click to publish)'}
                  >
                    {album.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditAlbum(album)}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Edit Album Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteAlbum(album, e)}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                    title="Delete Album"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Album Create / Edit Modal */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-extrabold text-slate-900">
                {albumModalMode === 'create' ? 'Create Camp Gallery Album' : 'Edit Album Details'}
              </h3>
              <button
                type="button"
                onClick={() => setAlbumModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="p-6 space-y-4 overflow-y-auto">
              {albumModalMode === 'create' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <strong>Notice:</strong> Newly created albums start <strong>unpublished (hidden)</strong> so you can safely upload and organize photos first.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Album Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                  placeholder="e.g. SKIT BDC 2026 - Main Camp Highlights"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Camp Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={albumForm.camp_year}
                    onChange={(e) => setAlbumForm({ ...albumForm, camp_year: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Camp Date</label>
                  <input
                    type="date"
                    value={albumForm.camp_date}
                    onChange={(e) => setAlbumForm({ ...albumForm, camp_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Associated Operational Camp
                </label>
                <select
                  value={albumForm.camp_id || ''}
                  onChange={(e) => setAlbumForm({ ...albumForm, camp_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                >
                  <option value="">None (Independent Album)</option>
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.public_title || c.title || `Camp ${c.camp_year}`} ({c.camp_year})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Optional link to an operational camp record.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Album Description
                </label>
                <textarea
                  rows={3}
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  placeholder="A short summary of this album for visitors..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]"
                />
              </div>

              {albumModalMode === 'edit' && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Public Visibility
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Published albums are accessible to all visitors on the public /gallery page.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={albumForm.is_published}
                    onChange={(e) => setAlbumForm({ ...albumForm, is_published: e.target.checked })}
                    className="w-4 h-4 accent-[#B91C1C] rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlbum}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingAlbum ? (
                    'Saving...'
                  ) : albumModalMode === 'create' ? (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Album</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
