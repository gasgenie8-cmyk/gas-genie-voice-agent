import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Loader2, Save, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
    display_name: string;
    phone: string;
    role: string;
}

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileData>({ display_name: '', phone: '', role: 'engineer' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                setProfile({ display_name: data.display_name, phone: data.phone || '', role: data.role });
            } else {
                // Auto-create profile
                const name = user.email?.split('@')[0] || 'Engineer';
                await supabase.from('profiles').insert({ id: user.id, display_name: name });
                setProfile({ display_name: name, phone: '', role: 'engineer' });
            }
            setLoading(false);
        })();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        await supabase.from('profiles').update({
            display_name: profile.display_name,
            phone: profile.phone || null,
        }).eq('id', user.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-xl font-bold text-foreground">My Profile</h1>
            </header>

            <main className="max-w-md mx-auto px-6 py-8">
                <div className="bg-card border border-border rounded-2xl p-6 space-y-5 animate-fade-in">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={28} className="text-primary" />
                        </div>
                        <div>
                            <p className="font-heading text-lg font-bold text-foreground">{profile.display_name}</p>
                            <p className="text-xs text-foreground/40">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium capitalize">
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-foreground/50 font-medium uppercase tracking-wider">Display Name</label>
                        <input
                            value={profile.display_name}
                            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-foreground/50 font-medium uppercase tracking-wider">Phone</label>
                        <input
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="07xxxxxxxxx"
                            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !profile.display_name}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-40"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Profile;
