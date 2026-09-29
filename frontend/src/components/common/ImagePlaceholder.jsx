import React from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * Generic placeholder shape for any image slot that has no real photo yet
 * (hero banners, about photos, gallery shots, camp cover images, etc.).
 */
export default function ImagePlaceholder({ className = '', iconClassName = 'w-8 h-8', label }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-[#FDF3EF] border border-dashed border-[#EAD7D0] text-[#C9A8A0] ${className}`}
    >
      <ImageIcon className={iconClassName} strokeWidth={1.5} />
      {label && <span className="text-[11px] font-medium tracking-wide">{label}</span>}
    </div>
  );
}
