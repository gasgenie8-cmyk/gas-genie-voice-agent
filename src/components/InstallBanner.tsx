import { useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'gas-genie-install-dismissed';
const VISIT_KEY = 'gas-genie-visit-count';

const InstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Don't show if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);
        if (isStandalone) return;

        // Don't show if previously dismissed
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed) return;

        // Track visits — show after 2+
        const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
        localStorage.setItem(VISIT_KEY, String(visits));
        if (visits < 2) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            setShowBanner(true);
            return;
        }

        // Listen for Chrome/Edge install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!showBanner) return null;

    return (
        <div className="sticky top-0 z-[60] bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20 px-4 py-3 animate-fade-in">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Download size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">Install Gas Genie</p>
                        {isIOS ? (
                            <p className="text-xs text-foreground/50 truncate">
                                Tap <Share2 size={11} className="inline -mt-0.5" /> then "Add to Home Screen"
                            </p>
                        ) : (
                            <p className="text-xs text-foreground/50 truncate">
                                Get the full app experience
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {!isIOS && deferredPrompt && (
                        <button
                            onClick={handleInstall}
                            className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                        >
                            Install
                        </button>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="text-foreground/30 hover:text-foreground/60 transition-colors p-1"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallBanner;
