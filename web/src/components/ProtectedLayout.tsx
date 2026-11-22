import { Link, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function ProtectedLayout() {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) return <p className="p-8 text-gray-500">Loading...</p>;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">
            JobTrack
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-black">
            Dashboard
          </Link>
          <Link
            to="/applications"
            className="text-sm text-gray-600 hover:text-black"
          >
            Applications
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user.fullName}</span>
          <button
            onClick={() => logout()}
            className="rounded border px-3 py-1 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
