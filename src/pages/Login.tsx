import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Flame, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setIsLoading(true);

            const { error } = await signIn(email, password);
            setIsLoading(false);

            if (error) {
                setError(error);
            } else {
                navigate('/voice');
            }
        },
        [email, password, signIn, navigate],
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Back</span>
            </button>

            <div className="w-full max-w-sm animate-fade-in">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                        <Flame size={28} className="text-white" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">Welcome Back</h1>
                    <p className="text-sm text-foreground/50 mt-1">Sign in to Gas Genie</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            placeholder="Email address"
                            required
                            autoFocus
                            autoComplete="email"
                            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="Password"
                            required
                            autoComplete="current-password"
                            className="w-full bg-card border border-border rounded-xl pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <p className="text-destructive text-sm text-center animate-fade-in">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-foreground/30">New here?</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Sign Up Link */}
                <Link
                    to="/signup"
                    className="block w-full text-center border border-border hover:border-primary/50 text-foreground/70 hover:text-foreground font-medium py-3 rounded-xl transition-all text-sm"
                >
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default Login;
