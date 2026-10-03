'use client';
 
import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
 
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 stroke-[1.8]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {error?.message || 'A temporary display issue occurred.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Dashboard</span>
        </button>
      </div>
    </div>
  );
}
