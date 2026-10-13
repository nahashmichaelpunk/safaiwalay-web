import { Outlet, useLocation } from 'react-router-dom';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

/** Stable label for telemetry (pathname, bounded). */
function routeLabelFromPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  return trimmed.slice(0, 120);
}

/**
 * Wraps all matched route content so public and protected pages get the same
 * route-level fallback UX; resets the boundary when the path changes.
 */
export default function RoutedSegmentErrorBoundary() {
  const location = useLocation();
  const routeName = routeLabelFromPath(location.pathname);
  return (
    <RouteErrorBoundary key={location.pathname} routeName={routeName}>
      <Outlet />
    </RouteErrorBoundary>
  );
}
