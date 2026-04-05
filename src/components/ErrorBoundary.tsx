import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    let message = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        message = parsed.error;
      }
    } catch (e) {
      // Not JSON, use as is
    }
    return { hasError: true, errorMessage: message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-amber-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops, something went wrong!</h2>
            <p className="text-gray-700 mb-4">
              We encountered an error while loading this page.
            </p>
            <div className="bg-red-50 p-4 rounded-md text-sm text-red-800 break-words mb-6">
              {this.state.errorMessage}
            </div>
            <button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
