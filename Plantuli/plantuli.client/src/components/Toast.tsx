import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <XCircle size={20} className="text-red-600" />,
        warning: <AlertCircle size={20} className="text-amber-600" />
    };

    const styles = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-amber-50 border-amber-200'
    };

    return (
        <div className={`
            flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-out
            ${styles[type]}
        `}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                    {title}
                </h4>
                {message && (
                    <p className="mt-1 text-sm text-gray-600">
                        {message}
                    </p>
                )}
            </div>

            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-50 rounded-md transition-colors"
                title="Cerrar"
            >
                <X size={16} className="text-gray-500" />
            </button>
        </div>
    );
}

// Toast Container Component
interface ToastContainerProps {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={onClose}
                />
            ))}
        </div>
    );
}