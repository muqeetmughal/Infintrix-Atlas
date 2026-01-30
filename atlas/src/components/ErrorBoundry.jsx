import { useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function ErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";
  let status = null;
  let stack = null;

  if (isRouteErrorResponse(error)) {
    // Errors thrown from loaders / actions
    status = error.status;
    title = `${error.status} — ${error.statusText}`;
    message = error.data?.message || "Route error occurred.";
  } else if (error instanceof Error) {
    // Runtime React errors
    title = "Application Error";
    message = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
      <div className="max-w-7xl w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        {status && (
          <p className="mb-3 text-sm text-slate-400">
            HTTP Status: <span className="font-mono">{status}</span>
          </p>
        )}

        <p className="text-slate-300 mb-4">{message}</p>

        {import.meta.env.DEV && stack && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200">
              Stack trace (dev only)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-black p-3 text-xs text-red-400">
              {stack}
            </pre>
          </details>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Reload
          </button>

          <button
            onClick={() => window.history.back()}
            className="rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}