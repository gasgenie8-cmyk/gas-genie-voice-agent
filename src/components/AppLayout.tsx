import { type ReactNode } from 'react';
import BottomNav from './BottomNav';
import InstallBanner from './InstallBanner';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    return (
        <div className="app-layout min-h-screen bg-background">
            <InstallBanner />
            {/* Main content — add bottom padding on mobile for the tab bar */}
            <div className="pb-20 md:pb-0">
                {children}
            </div>
            <BottomNav />
        </div>
    );
};

export default AppLayout;
