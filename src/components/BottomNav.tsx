import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Mic, Camera, Clock, MoreHorizontal,
    Image, BookOpen, User, X
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: React.ElementType;
    path: string;
}

const MAIN_TABS: NavItem[] = [
    { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Voice', icon: Mic, path: '/voice' },
    { label: 'Diagnose', icon: Camera, path: '/diagnose' },
    { label: 'History', icon: Clock, path: '/history' },
];

const MORE_ITEMS: NavItem[] = [
    { label: 'Photos', icon: Image, path: '/photos' },
    { label: 'Reference', icon: BookOpen, path: '/reference' },
    { label: 'Profile', icon: User, path: '/profile' },
];

// Routes where bottom nav should be hidden
const HIDDEN_ROUTES = ['/login', '/signup', '/admin', '/share'];

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);

    // Hide on certain routes
    const shouldHide = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));
    if (shouldHide) return null;

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
        return location.pathname === path;
    };

    const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path);

    const handleNavigate = (path: string) => {
        navigate(path);
        setMoreOpen(false);
    };

    return (
        <>
            {/* More menu overlay */}
            {moreOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMoreOpen(false)}>
                    <div
                        className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 bg-card border border-border rounded-2xl overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <span className="text-sm font-semibold text-foreground">More</span>
                            <button onClick={() => setMoreOpen(false)} className="text-foreground/40 hover:text-foreground">
                                <X size={18} />
                            </button>
                        </div>
                        {MORE_ITEMS.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-colors
                                    ${location.pathname === item.path
                                        ? 'text-primary bg-primary/5'
                                        : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom tab bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-center justify-around h-16">
                    {MAIN_TABS.map((tab) => {
                        const active = isActive(tab.path);
                        return (
                            <button
                                key={tab.path}
                                onClick={() => handleNavigate(tab.path)}
                                className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors duration-200
                                    ${active ? 'text-primary' : 'text-foreground/40'}`}
                            >
                                <div className={`relative ${active ? '' : ''}`}>
                                    <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                    {active && (
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* More tab */}
                    <button
                        onClick={() => setMoreOpen(!moreOpen)}
                        className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors duration-200
                            ${isMoreActive || moreOpen ? 'text-primary' : 'text-foreground/40'}`}
                    >
                        <MoreHorizontal size={22} strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8} />
                        <span className={`text-[10px] font-medium ${isMoreActive || moreOpen ? 'font-semibold' : ''}`}>
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
