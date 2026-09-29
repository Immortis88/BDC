import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import {
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  FileCheck,
  Sparkles,
  Info,
  Maximize2,
  Crop as CropIcon,
  Smartphone,
  Monitor
} from 'lucide-react';
import Swal from 'sweetalert2';
import { adminService } from '../services/adminService.js';

/**
 * Creates an Image element from a data/object URL
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Crops image on an HTML5 canvas and returns a Blob
 */
async function getCroppedImg(imageSrc, pixelCrop, isPng = false) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const quality = isPng ? undefined : 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas could not create blob'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

const COMMON_RATIOS = [
  { label: 'Original', value: null },
  { label: '16:9 Banner', value: 16 / 9 },
  { label: '4:3 Standard', value: 4 / 3 },
  { label: '1:1 Square', value: 1 },
  { label: 'Freeform', value: undefined }
];

const FOCAL_PRESETS = [
  { label: 'Top Left', value: 'left top' },
  { label: 'Top Center', value: 'center top' },
  { label: 'Top Right', value: 'right top' },
  { label: 'Center Left', value: 'left center' },
  { label: 'Center', value: 'center center' },
  { label: 'Center Right', value: 'right center' },
  { label: 'Right 20% (Hero)', value: 'right 20%' },
  { label: 'Bottom Center', value: 'center bottom' }
];

/**
 * Primary Reusable Image Picker & Adjustment Modal
 */
export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select or Upload Image',
  kind = 'SITE',
  campId = null,
  albumId = null,
  area = 'homepage',
  aspectRatio = null, // e.g. 1, 16/9, 4/3, or null
  cropShape = 'rect', // 'rect' | 'round'
  isLogo = false, // If true, preserves PNG transparency and defaults to original
  defaultOriginal = false, // If true, starts in uncropped original mode
  showFocalPicker = false, // If true, enables responsive desktop & mobile focal position controls
  initialFocalPosition = 'center',
  recommendation = 'JPEG, PNG, or WebP up to 10MB'
}) {
  const shouldDefaultOriginal = Boolean(
    isLogo || kind === 'GALLERY' || defaultOriginal || aspectRatio === null
  );

  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageMeta, setImageMeta] = useState(null); // { width, height }
  const [cropMode, setCropMode] = useState(shouldDefaultOriginal ? 'ORIGINAL' : 'CROP');
  const [activeRatio, setActiveRatio] = useState(aspectRatio || null);
  const [focalPosition, setFocalPosition] = useState(initialFocalPosition);
  const [previewTab, setPreviewTab] = useState('crop'); // 'crop' | 'responsive'
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      setCropMode(shouldDefaultOriginal ? 'ORIGINAL' : 'CROP');
      setActiveRatio(aspectRatio || null);
      setFocalPosition(initialFocalPosition || 'center');
    }
  }, [isOpen, shouldDefaultOriginal, aspectRatio, initialFocalPosition]);

  const resetState = () => {
    setFile(null);
    setImageSrc(null);
    setImageMeta(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError('');
    setIsDragOver(false);
    setCropMode(shouldDefaultOriginal ? 'ORIGINAL' : 'CROP');
    setPreviewTab('crop');
  };

  const handleClose = () => {
    if (uploading) return; // Prevent closing while network request in flight
    isCancelledRef.current = true;
    resetState();
    onClose();
  };

  const handleFileChange = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB. Please choose a smaller image.');
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const src = reader.result;
      setImageSrc(src);
      setZoom(1);
      setCrop({ x: 0, y: 0 });

      // Extract natural dimensions
      const img = new Image();
      img.onload = () => {
        setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = src;
    });
    reader.readAsDataURL(selectedFile);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUploadAndApply = async () => {
    if (!file && !imageSrc) {
      setError('Please select an image file first.');
      return;
    }

    setUploading(true);
    setError('');
    isCancelledRef.current = false;

    try {
      let uploadFile = file;

      // If user chose CROP and we have crop data
      if (cropMode === 'CROP' && croppedAreaPixels && imageSrc) {
        const isPng = file?.type === 'image/png';
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, isPng);
        if (isCancelledRef.current) return;

        const fileName = file?.name || (isPng ? 'cropped.png' : 'cropped.jpg');
        uploadFile = new File([croppedBlob], fileName, {
          type: isPng ? 'image/png' : 'image/jpeg'
        });
      }

      if (isCancelledRef.current) return;

      const res = await adminService.upload(uploadFile, {
        kind,
        campId: campId ? Number(campId) : null,
        albumId: albumId ? Number(albumId) : null,
        area
      });

      // Strict check: if cancelled while upload was in flight, ignore response completely
      if (isCancelledRef.current) return;

      if (res.success && (res.url || res.data?.url)) {
        const finalUrl = res.url || res.data?.url;
        const finalAssetId = res.asset_id || res.data?.asset_id || null;

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Image uploaded successfully.',
          showConfirmButton: false,
          timer: 1800
        });

        onSelect({
          url: finalUrl,
          assetId: finalAssetId,
          relativePath: res.relative_path || res.data?.relative_path,
          width: res.data?.width,
          height: res.data?.height,
          focalPosition,
          isOriginal: cropMode === 'ORIGINAL'
        });

        resetState();
        onClose();
      } else {
        setError(res.message || 'Image upload failed on the server.');
      }
    } catch (err) {
      if (isCancelledRef.current) return;
      console.error('[ImagePickerModal] Upload error:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      if (!isCancelledRef.current) {
        setUploading(false);
      }
    }
  };

  if (!isOpen) return null;

  const isHeroOrBanner = kind === 'HERO' || showFocalPicker;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) handleClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-[#B91C1C] flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">{recommendation}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: File Selection (Dropzone) */}
          {!imageSrc ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragOver
                  ? 'border-red-500 bg-red-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-red-400 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600">
                <Upload className="w-6 h-6 text-[#B91C1C]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drag and drop image here
                </p>
                <p className="text-xs text-slate-500">
                  Supports JPEG, PNG, and WebP (Max 10MB)
                </p>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                Browse From Computer
              </button>
            </div>
          ) : (
            /* Mode 2: Interactive Cropper / Adjustment */
            <div className="space-y-4">
              {/* Top Toolbar: Choice between Original Proportions vs Crop */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-slate-100 rounded-xl">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => { setCropMode('ORIGINAL'); setPreviewTab('crop'); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      cropMode === 'ORIGINAL'
                        ? 'bg-[#B91C1C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Keep Original (No Crop)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCropMode('CROP')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      cropMode === 'CROP'
                        ? 'bg-[#B91C1C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <CropIcon className="w-3.5 h-3.5" />
                    <span>Crop &amp; Adjust</span>
                  </button>
                </div>

                {isHeroOrBanner && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('crop')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        previewTab === 'crop' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Adjustment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('responsive')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        previewTab === 'responsive' ? 'bg-[#B91C1C] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Responsive Preview</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logo / Transparency notice */}
              {isLogo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Sponsor Logo Mode:</strong>
                    PNG transparency is preserved. Uncropped mode is active by default so original brand proportions and transparency are untouched.
                  </div>
                </div>
              )}

              {/* View 1: Responsive Framing Preview for Hero / Banners */}
              {isHeroOrBanner && previewTab === 'responsive' ? (
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Live Responsive Framing Preview
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Simulating how the banner adapts between desktop and mobile viewport ratios.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">Focal Point:</label>
                      <select
                        value={focalPosition}
                        onChange={(e) => setFocalPosition(e.target.value)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white"
                      >
                        {FOCAL_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Desktop Viewport Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Monitor className="w-3.5 h-3.5 text-slate-500" />
                        <span>Desktop Banner (16:9 Wide)</span>
                      </div>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shadow-xs">
                        <img
                          src={imageSrc}
                          alt="Desktop framing preview"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: focalPosition }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white font-mono">
                          focal: {focalPosition}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Viewport Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mobile Viewport (Taller Crop)</span>
                      </div>
                      <div className="relative w-44 mx-auto aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-md">
                        <img
                          src={imageSrc}
                          alt="Mobile framing preview"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: focalPosition }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white font-mono">
                          Mobile 390px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* View 2: Cropper / Original Preview */
                <div className="space-y-3">
                  <div
                    className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                    }}
                  >
                    {cropMode === 'CROP' ? (
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={activeRatio || undefined}
                        cropShape={cropShape}
                        showGrid={true}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    ) : (
                      /* Original Full Preview */
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
                        <img
                          src={imageSrc}
                          alt="Original Preview"
                          className="max-w-full max-h-full object-contain drop-shadow-xs"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono">
                          Original {imageMeta ? `${imageMeta.width}×${imageMeta.height}` : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mode-specific Controls */}
                  {cropMode === 'CROP' ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      {/* Ratio Selector Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-600 mr-1">Aspect Ratio:</span>
                        {COMMON_RATIOS.map((r) => {
                          const isSelected = activeRatio === r.value;
                          return (
                            <button
                              key={r.label}
                              type="button"
                              onClick={() => {
                                if (r.value === null) {
                                  setCropMode('ORIGINAL');
                                } else {
                                  setActiveRatio(r.value);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#B91C1C] text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Zoom Slider & Reset */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-200">
                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                          <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#B91C1C]"
                          />
                          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-600 shrink-0 min-w-[36px]">
                            {Math.round(zoom * 100)}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setZoom(1);
                            setCrop({ x: 0, y: 0 });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Crop</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="text-slate-600">
                        <strong className="text-slate-800">Original Proportions Maintained.</strong> Photo will be uploaded without forcing 4:3 or cropping.
                      </div>
                      <button
                        type="button"
                        onClick={() => setCropMode('CROP')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold shrink-0 cursor-pointer"
                      >
                        Crop Instead
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* File Info & Replace button */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2 text-slate-600 min-w-0">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">{file?.name}</span>
                  <span className="text-slate-400">
                    ({Math.round((file?.size || 0) / 1024)} KB
                    {imageMeta ? ` • ${imageMeta.width}×${imageMeta.height}px` : ''})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetState}
                  disabled={uploading}
                  className="text-red-700 hover:text-red-900 font-semibold underline shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>

          {imageSrc && (
            <button
              type="button"
              onClick={handleUploadAndApply}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing &amp; Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {cropMode === 'ORIGINAL' ? 'Apply Original Image' : 'Apply Cropped Image'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Image Picker Form Field
 * Renders thumbnail, label, and "Choose Image" / "Remove" buttons without exposing raw paths.
 */
export function ImagePickerField({
  label,
  value,
  onChange,
  onRemove,
  title,
  kind = 'SITE',
  campId = null,
  albumId = null,
  area = 'homepage',
  aspectRatio = null,
  cropShape = 'rect',
  isLogo = false,
  defaultOriginal = false,
  showFocalPicker = false,
  initialFocalPosition = 'center',
  recommendation,
  placeholderText = 'No image selected'
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}

      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Thumbnail Preview */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center ${
            cropShape === 'round' ? 'rounded-full' : 'rounded-xl'
          } ${
            isLogo ? 'bg-slate-50' : 'bg-slate-100'
          }`}
          style={
            isLogo
              ? {
                  backgroundImage:
                    'linear-gradient(45deg, #f8fafc 25%, transparent 25%), linear-gradient(-45deg, #f8fafc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8fafc 75%), linear-gradient(-45deg, transparent 75%, #f8fafc 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                }
              : {}
          }
        >
          {value ? (
            <img
              src={value}
              alt="Thumbnail"
              className={`w-full h-full ${isLogo ? 'object-contain p-1' : 'object-cover'}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate">
            {value ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <FileCheck className="w-3.5 h-3.5" />
                Image attached
              </span>
            ) : (
              <span className="text-slate-400 italic">{placeholderText}</span>
            )}
          </p>
          {recommendation && (
            <p className="text-[11px] text-slate-500 mt-0.5">{recommendation}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>{value ? 'Change Image' : 'Choose Image'}</span>
            </button>

            {value && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ImagePickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(res) => {
          onChange(res.url, res.assetId, res);
        }}
        title={title || label || 'Select Image'}
        kind={kind}
        campId={campId}
        albumId={albumId}
        area={area}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        isLogo={isLogo}
        defaultOriginal={defaultOriginal}
        showFocalPicker={showFocalPicker}
        initialFocalPosition={initialFocalPosition}
        recommendation={recommendation}
      />
    </div>
  );
}
