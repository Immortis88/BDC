import React from 'react';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

export default function DragSortableItem({
  children,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  className = ''
}) {
  return (
    <div className={`group relative flex items-center gap-2 ${className}`}>
      {/* Drag handle & keyboard reorder controls */}
      <div className="flex flex-col items-center justify-center text-slate-400 py-1">
        <span
          title="Drag handle (simulated)"
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <div className="flex flex-col -space-y-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move item up"
            className="p-0.5 rounded text-slate-400 hover:text-[#981B24] disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move item down"
            className="p-0.5 rounded text-slate-400 hover:text-[#981B24] disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main item content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
