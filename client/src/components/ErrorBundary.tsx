import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
          <p>Something went wrong.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border px-4 py-2"
            style={{ borderColor: 'var(--border)' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
