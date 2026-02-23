import { X } from 'lucide-react';

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-start gap-3 p-4 rounded-xl shadow-lg animate-slide-up ${toast.variant === 'destructive'
                            ? 'bg-destructive/90 text-white'
                            : 'bg-card border border-border text-foreground'
                        }`}
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{toast.title}</p>
                        {toast.description && (
                            <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
