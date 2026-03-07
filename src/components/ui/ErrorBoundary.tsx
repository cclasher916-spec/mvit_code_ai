import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-lg w-full text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-red-400 text-sm mb-6 bg-red-500/5 p-3 rounded-lg border border-red-500/10 text-left font-mono overflow-auto max-h-32">
                            {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="bg-red-500 hover:bg-red-600 text-white border-transparent mx-auto"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
