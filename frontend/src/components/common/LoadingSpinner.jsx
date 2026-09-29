import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500 gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-blood-200 border-t-blood-600 rounded-full animate-spin`}
      />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}
