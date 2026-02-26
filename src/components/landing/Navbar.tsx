import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Flame, LogOut, MessageSquare, Camera, User, LayoutDashboard, Wrench, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        setIsOpen(false);
    };

    const authLinks = [
        { to: '/voice', label: 'Talk to Genie', primary: true },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/diagnose', label: 'Diagnose', icon: Wrench },
        { to: '/history', label: 'History', icon: MessageSquare },
        { to: '/photos', label: 'Photos', icon: Camera },
        { to: '/reference', label: 'Reference', icon: BookOpen },
        { to: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Flame size={20} className="text-white" />
                    </div>
                    <span className="font-heading text-xl font-bold text-foreground">
                        Gas Genie
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    <a href="#how-it-works" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                        How It Works
                    </a>
                    {user ? (
                        <>
                            {authLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={link.primary
                                        ? "bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                        : "flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"}
                                >
                                    {link.icon && <link.icon size={15} />}
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
                            >
                                <LogOut size={15} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-medium">
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-foreground/70">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden px-6 pb-4 space-y-2 animate-fade-in">
                    <a href="#how-it-works" onClick={() => setIsOpen(false)}
                        className="block text-sm text-foreground/60 hover:text-foreground transition-colors py-2">
                        How It Works
                    </a>
                    {user ? (
                        <>
                            {authLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsOpen(false)}
                                    className={link.primary
                                        ? "block w-full text-center bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                        : "flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors py-2"}
                                >
                                    {link.icon && <link.icon size={16} />}
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 w-full text-sm text-foreground/50 hover:text-foreground transition-colors py-2"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={() => setIsOpen(false)}
                                className="block w-full text-center border border-border text-foreground/70 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                                Sign In
                            </Link>
                            <Link to="/signup" onClick={() => setIsOpen(false)}
                                className="block w-full text-center bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
