import { ThemeProvider } from '@/components/theme-provider';
import { createRootRoute, Outlet } from '@tanstack/react-router';

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Outlet />
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
