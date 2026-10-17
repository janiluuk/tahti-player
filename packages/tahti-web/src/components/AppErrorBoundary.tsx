import { Component, type ErrorInfo, type ReactNode } from 'react';

import { AppErrorFallback } from './AppErrorFallback';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TahtiApp error boundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <AppErrorFallback
          error={this.state.error}
          reset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
