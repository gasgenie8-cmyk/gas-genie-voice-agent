import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

const ADMIN_PIN = '1234';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (pin === ADMIN_PIN) {
                sessionStorage.setItem('gas-genie-admin', 'true');
                navigate('/admin/dashboard');
            } else {
                setError('Incorrect PIN');
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
                setPin('');
            }
        },
        [pin, navigate],
    );

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(value);
        if (error) setError('');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Back</span>
            </button>

            <div
                className={`w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg animate-fade-in ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
                    }`}
                style={isShaking ? {
                    animation: 'shake 0.5s ease-in-out',
                } : undefined}
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock size={28} className="text-primary" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">Admin Access</h1>
                    <p className="text-sm text-foreground/60 mt-2">Enter your 4-digit PIN</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="• • • •"
                            autoFocus
                            className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-background border border-border rounded-xl px-4 py-4 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        {error && (
                            <p className="text-destructive text-sm text-center mt-2 animate-fade-in">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length < 4}
                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Unlock
                    </button>
                </form>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
        </div>
    );
};

export default AdminLogin;
