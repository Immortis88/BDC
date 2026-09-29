import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#FFFDF9]">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-[#F3DEDA] shadow-sm animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-[#981B24]/10 text-[#981B24] flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-[#102B46] tracking-tight">404</h1>
          <h2 className="text-lg font-semibold text-[#102B46] mt-1">Page Not Found</h2>
          <p className="text-sm text-[#68717D] mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#981B24] hover:bg-[#7A1620] text-white font-medium text-sm rounded-xl transition shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
