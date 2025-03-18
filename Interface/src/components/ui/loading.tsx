import React from "react";

export function LoadingSpinner({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "w-5 h-5",
    default: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="h-full w-full border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-400 rounded-full" />
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <LoadingSpinner size="large" className="text-blue-500" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-100">Processing Data</h3>
          <p className="text-sm text-gray-400">Analyzing patterns and insights...</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingCard({ title = "Loading..." }: { title?: string }) {
  return (
    <div className="rounded-lg bg-gray-800/50 p-4 backdrop-blur-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
} 