import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Flame, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const passwordStrength = (() => {
        if (password.length === 0) return { score: 0, label: '' };
        if (password.length < 6) return { score: 1, label: 'Too short' };
        let score = 2;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return { score, label: labels[score] || 'Strong' };
    })();

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');

            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            setIsLoading(true);
            const { error } = await signUp(email, password);
            setIsLoading(false);

            if (error) {
                setError(error);
            } else {
                setSuccess(true);
            }
        },
        [email, password, confirmPassword, signUp],
    );

    if (success) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-primary" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
                    <p className="text-sm text-foreground/50 mb-8">
                        We've sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
                        Click the link to activate your account.
                    </p>
                    <Link
                        to="/login"
                        className="block w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

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
                    <h1 className="font-heading text-2xl font-bold text-foreground">Create Account</h1>
                    <p className="text-sm text-foreground/50 mt-1">Start using Gas Genie today</p>
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

                    <div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="Password (min 6 characters)"
                                required
                                autoComplete="new-password"
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
                        {/* Password strength */}
                        {password.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 flex gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score
                                                    ? passwordStrength.score <= 2
                                                        ? 'bg-destructive'
                                                        : passwordStrength.score <= 3
                                                            ? 'bg-warning'
                                                            : 'bg-primary'
                                                    : 'bg-border'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className={`text-xs ${passwordStrength.score <= 2 ? 'text-destructive' : passwordStrength.score <= 3 ? 'text-warning' : 'text-primary'
                                    }`}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                            placeholder="Confirm password"
                            required
                            autoComplete="new-password"
                            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-destructive text-sm text-center animate-fade-in">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password || !confirmPassword}
                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-foreground/30">Already have an account?</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Login Link */}
                <Link
                    to="/login"
                    className="block w-full text-center border border-border hover:border-primary/50 text-foreground/70 hover:text-foreground font-medium py-3 rounded-xl transition-all text-sm"
                >
                    Sign in instead
                </Link>
            </div>
        </div>
    );
};

export default SignUp;
