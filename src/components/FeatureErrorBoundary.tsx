import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logBoundaryError } from '@/lib/monitoring/error-logger';

interface Props {
  children: ReactNode;
  /** Shown if the child subtree throws during render. Defaults to null (fails quietly). */
  fallback?: ReactNode;
  /** Included in `console.error` to identify which boundary failed. */
  name?: string;
}

interface State {
  hasError: boolean;
  correlationId: string | null;
}

/**
 * Catches render errors in a subtree and shows a small fallback.
 * Use for optional UI (e.g. FABs) so a broken widget does not replace the whole app
 * (unlike the full-page `AppErrorBoundary` at the app root).
 */
export default class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, correlationId: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, correlationId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const label = this.props.name ?? 'FeatureErrorBoundary';
    const correlationId = logBoundaryError({
      boundary: label,
      severity: 'feature',
      error,
      errorInfo,
    });
    this.setState({ correlationId });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
