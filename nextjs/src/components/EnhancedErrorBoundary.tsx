"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// Enhanced Error Boundary with React 19 patterns
export class EnhancedErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Call the onError prop if provided
        this.props.onError?.(error, errorInfo);

        // Enhanced error logging for development
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught an Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.groupEnd();
        }
    }

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default enhanced error UI
            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="mb-4">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-4">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <Button 
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Developer Info
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <EnhancedErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </EnhancedErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    
    return WrappedComponent;
}