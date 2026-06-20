import { createRootRoute, Outlet } from '@tanstack/react-router';

function RootComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Outlet />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
