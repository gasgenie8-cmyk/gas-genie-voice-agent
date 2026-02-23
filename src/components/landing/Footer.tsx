import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-border px-6 py-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Flame size={16} className="text-primary" />
                    <span className="text-sm text-foreground/40 font-medium">
                        Gas Genie © {new Date().getFullYear()}
                    </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-foreground/40">
                    <Link to="/admin" className="hover:text-foreground/70 transition-colors">
                        Admin
                    </Link>
                    <a href="#how-it-works" className="hover:text-foreground/70 transition-colors">
                        How It Works
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
