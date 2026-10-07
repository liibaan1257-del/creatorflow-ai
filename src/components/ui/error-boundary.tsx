"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Contains a failure to one part of the UI (e.g. the top bar) instead of the
 * nearest error.tsx replacing the whole layout. Also catches errors thrown by
 * Server Components rendered inside it.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
