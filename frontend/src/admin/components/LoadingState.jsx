import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading administrative data...' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-8 h-8 text-[#981B24] animate-spin mb-3" />
      <p className="text-xs sm:text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}
