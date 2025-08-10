import { useState, useCallback } from 'react';
import type { ToastProps, ToastType } from '../components/Toast';

interface ShowToastParams {
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = useCallback(({ type, title, message, duration }: ShowToastParams) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newToast: ToastProps = {
            id,
            type,
            title,
            message,
            duration,
            onClose: () => {} // Will be set below
        };

        setToasts(prev => [...prev, newToast]);
        
        return id;
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Convenience methods
    const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
        return showToast({ type: 'success', title, message, duration });
    }, [showToast]);

    const showError = useCallback((title: string, message?: string, duration?: number) => {
        return showToast({ type: 'error', title, message, duration });
    }, [showToast]);

    const showWarning = useCallback((title: string, message?: string, duration?: number) => {
        return showToast({ type: 'warning', title, message, duration });
    }, [showToast]);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        closeToast,
        clearAllToasts
    };
}