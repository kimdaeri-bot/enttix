'use client';

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Booking Page Error</h2>
      <pre className="bg-gray-100 p-4 rounded-lg text-left text-sm overflow-auto mb-4 whitespace-pre-wrap">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
