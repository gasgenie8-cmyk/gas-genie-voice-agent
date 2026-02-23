import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, Users, Activity, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
    totalCalls: number;
    totalMinutes: number;
    activeUsers: number;
    callsToday: number;
}

interface CallLog {
    id: string;
    started_at: string;
    duration_seconds: number | null;
    status: string;
    topic_tags: string[] | null;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalCalls: 0,
        totalMinutes: 0,
        activeUsers: 0,
        callsToday: 0,
    });
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('gas-genie-admin');
        if (!isAuthenticated) {
            navigate('/admin');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const { data: callsData, error } = await supabase
                .from('voice_calls')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[AdminDashboard:fetchData]', error);
                // Use empty data gracefully
                setLoading(false);
                return;
            }

            const allCalls = callsData ?? [];
            const today = new Date().toISOString().split('T')[0];

            const totalMinutes = allCalls.reduce(
                (sum, c) => sum + (c.duration_seconds ?? 0),
                0,
            ) / 60;

            const uniqueUsers = new Set(allCalls.map((c) => c.user_id).filter(Boolean));

            const callsToday = allCalls.filter(
                (c) => c.started_at?.startsWith(today),
            ).length;

            setStats({
                totalCalls: allCalls.length,
                totalMinutes: Math.round(totalMinutes),
                activeUsers: uniqueUsers.size,
                callsToday,
            });

            setCalls(allCalls);
        } catch (err) {
            console.error('[AdminDashboard:fetchData]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('gas-genie-admin');
        navigate('/admin');
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statCards = [
        { label: 'Total Calls', value: stats.totalCalls, icon: Phone, color: 'text-primary' },
        { label: 'Total Minutes', value: stats.totalMinutes, icon: Clock, color: 'text-accent' },
        { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-warning' },
        { label: 'Calls Today', value: stats.callsToday, icon: Activity, color: 'text-success' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-foreground/70 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-heading text-xl font-bold text-foreground">
                        Command Centre
                    </h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-foreground/60 hover:text-destructive transition-colors text-sm"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card) => (
                        <div
                            key={card.label}
                            className="bg-card border border-border rounded-xl p-5 animate-fade-in"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <card.icon size={20} className={card.color} />
                                <span className="text-xs text-foreground/50 font-medium uppercase tracking-wider">
                                    {card.label}
                                </span>
                            </div>
                            <p className="font-heading text-3xl font-bold text-foreground">
                                {loading ? '—' : card.value.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Call Logs */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                            Recent Calls
                        </h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-foreground/40">
                            Loading...
                        </div>
                    ) : calls.length === 0 ? (
                        <div className="px-6 py-12 text-center text-foreground/40">
                            <Phone size={32} className="mx-auto mb-3 opacity-30" />
                            <p>No calls recorded yet</p>
                            <p className="text-sm mt-1">Calls will appear here once engineers start using Gas Genie</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-foreground/50 border-b border-border">
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Duration</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Topics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {calls.map((call) => (
                                        <tr key={call.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4 text-foreground">
                                                {formatDate(call.started_at)}
                                            </td>
                                            <td className="px-6 py-4 text-foreground/80 font-mono">
                                                {formatDuration(call.duration_seconds)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${call.status === 'completed'
                                                            ? 'bg-success/10 text-success'
                                                            : call.status === 'active'
                                                                ? 'bg-primary/10 text-primary'
                                                                : call.status === 'failed'
                                                                    ? 'bg-destructive/10 text-destructive'
                                                                    : 'bg-muted text-foreground/50'
                                                        }`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {call.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {call.topic_tags?.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs"
                                                        >
                                                            {tag}
                                                        </span>
                                                    )) ?? (
                                                            <span className="text-foreground/30">—</span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
