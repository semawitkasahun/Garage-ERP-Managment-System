import React from 'react';
import { useRouteError } from 'react-router-dom';

export function NotFound() {
  const error = useRouteError();
  const status = error?.status || 404;
  const statusText = error?.statusText || 'Page Not Found';
  const message = typeof error?.data === 'string' ? error.data : 'The page you are looking for does not exist.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4">{status}</h1>
        <h2 className="text-2xl font-semibold mb-2">{statusText}</h2>
        <p className="mb-6">{message}</p>
        <a href="/" className="inline-block px-6 py-3 bg-white text-indigo-900 rounded-full hover:bg-gray-100 transition">Go Home</a>
      </div>
    </div>
  );
}
