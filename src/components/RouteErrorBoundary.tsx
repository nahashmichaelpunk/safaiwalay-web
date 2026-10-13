import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logBoundaryError } from '@/lib/monitoring/error-logger';
import { WHATSAPP_CHAT_URL } from '@/lib/contact-links';

interface Props {
  children: ReactNode;
  routeName: string;
}

interface State {
  hasError: boolean;
  correlationId: string | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, correlationId: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, correlationId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const correlationId = logBoundaryError({
      boundary: `RouteErrorBoundary:${this.props.routeName}`,
      severity: 'route',
      error,
      errorInfo,
      routeName: this.props.routeName,
    });
    this.setState({ correlationId });
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border bg-card p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">We hit a temporary issue</h2>
          <p className="text-muted-foreground">
            This section failed to load. You can retry, explore services, or contact us on WhatsApp.
          </p>
          {this.state.correlationId && (
            <p className="text-xs text-muted-foreground">
              Error reference: <code>{this.state.correlationId}</code>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link to="/services">View Services</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={WHATSAPP_CHAT_URL} target="_blank" rel="noopener noreferrer">
                WhatsApp Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
