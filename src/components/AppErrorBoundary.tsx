import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logBoundaryError } from '@/lib/monitoring/error-logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  correlationId: string | null;
}

export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, correlationId: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, correlationId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const correlationId = logBoundaryError({
      boundary: 'AppErrorBoundary',
      severity: 'root',
      error,
      errorInfo,
    });
    this.setState({ correlationId });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            The app hit an unexpected error. You can try reloading the page.
          </p>
          {this.state.correlationId && (
            <p className="text-xs text-muted-foreground">
              Error reference: <code>{this.state.correlationId}</code>
            </p>
          )}
          <Button type="button" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
