import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, Users, Activity, LogOut, ArrowLeft, Briefcase, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

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

interface JobStatusCount {
    status: string;
    count: number;
}

interface DailyCount {
    date: string;
    count: number;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalCalls: 0, totalMinutes: 0, activeUsers: 0, callsToday: 0,
    });
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [jobStatuses, setJobStatuses] = useState<JobStatusCount[]>([]);
    const [dailyJobs, setDailyJobs] = useState<DailyCount[]>([]);
    const [engineers, setEngineers] = useState<{ display_name: string; role: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('gas-genie-admin');
        if (!isAuthenticated) { navigate('/admin'); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            // Calls data
            const callsSnap = await getDocs(
                query(collection(db, 'voiceCalls'), orderBy('started_at', 'desc'), limit(50))
            );
            const allCalls = callsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CallLog[];
            const today = new Date().toISOString().split('T')[0];
            const totalMinutes = allCalls.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0) / 60;
            const uniqueUsers = new Set(allCalls.map((c) => (c as Record<string, string>).user_id).filter(Boolean));
            const callsToday = allCalls.filter((c) => c.started_at?.startsWith(today)).length;

            setStats({ totalCalls: allCalls.length, totalMinutes: Math.round(totalMinutes), activeUsers: uniqueUsers.size, callsToday });
            setCalls(allCalls);

            // Job status breakdown
            const jobsSnap = await getDocs(collection(db, 'jobs'));
            const jobs = jobsSnap.docs.map(d => d.data());
            if (jobs.length > 0) {
                const counts: Record<string, number> = {};
                jobs.forEach((j) => { const s = (j.status as string) || 'Pending'; counts[s] = (counts[s] || 0) + 1; });
                setJobStatuses(Object.entries(counts).map(([status, count]) => ({ status, count })));
            }

            // Daily jobs (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const recentJobsSnap = await getDocs(
                query(collection(db, 'jobs'), where('created_at', '>=', weekAgo.toISOString()))
            );
            const recentJobs = recentJobsSnap.docs.map(d => d.data());

            if (recentJobs.length > 0) {
                const daily: Record<string, number> = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    daily[d.toISOString().split('T')[0]] = 0;
                }
                recentJobs.forEach((j) => {
                    const d = (j.created_at as string)?.split('T')[0];
                    if (d && daily[d] !== undefined) daily[d]++;
                });
                setDailyJobs(Object.entries(daily).map(([date, count]) => ({ date, count })));
            }

            // Engineers
            const profilesSnap = await getDocs(collection(db, 'profiles'));
            setEngineers(profilesSnap.docs.map(d => d.data() as { display_name: string; role: string }));
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
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const totalJobs = jobStatuses.reduce((s, j) => s + j.count, 0);
    const statusColors: Record<string, string> = {
        Pending: 'bg-warning', 'In Progress': 'bg-primary', Complete: 'bg-success', Cancelled: 'bg-destructive',
    };

    const maxDaily = Math.max(...dailyJobs.map((d) => d.count), 1);

    const statCards = [
        { label: 'Total Calls', value: stats.totalCalls, icon: Phone, color: 'text-primary' },
        { label: 'Total Minutes', value: stats.totalMinutes, icon: Clock, color: 'text-accent' },
        { label: 'Engineers', value: engineers.length || stats.activeUsers, icon: Users, color: 'text-warning' },
        { label: 'Calls Today', value: stats.callsToday, icon: Activity, color: 'text-success' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-heading text-xl font-bold text-foreground">Command Centre</h1>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-foreground/60 hover:text-destructive transition-colors text-sm">
                    <LogOut size={16} /> Logout
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card) => (
                        <div key={card.label} className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                            <div className="flex items-center gap-3 mb-3">
                                <card.icon size={20} className={card.color} />
                                <span className="text-xs text-foreground/50 font-medium uppercase tracking-wider">{card.label}</span>
                            </div>
                            <p className="font-heading text-3xl font-bold text-foreground">
                                {loading ? '—' : card.value.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Analytics Row */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {/* Job Status Breakdown */}
                    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={18} className="text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Job Status</h3>
                        </div>
                        {loading ? (
                            <Loader2 size={20} className="text-foreground/20 animate-spin mx-auto my-6" />
                        ) : totalJobs === 0 ? (
                            <p className="text-xs text-foreground/30 text-center py-6">No jobs yet</p>
                        ) : (
                            <div className="space-y-3">
                                {jobStatuses.map((js) => (
                                    <div key={js.status}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-foreground/70">{js.status}</span>
                                            <span className="font-mono text-foreground/50">{js.count}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${statusColors[js.status] || 'bg-foreground/20'}`}
                                                style={{ width: `${(js.count / totalJobs) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Daily Jobs Sparkline */}
                    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-accent" />
                            <h3 className="text-sm font-semibold text-foreground">Jobs (Last 7 Days)</h3>
                        </div>
                        {loading ? (
                            <Loader2 size={20} className="text-foreground/20 animate-spin mx-auto my-6" />
                        ) : (
                            <div className="flex items-end gap-1.5 h-24">
                                {dailyJobs.map((d) => (
                                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-foreground/40 font-mono">{d.count}</span>
                                        <div
                                            className="w-full bg-gradient-to-t from-primary to-accent rounded-t transition-all"
                                            style={{ height: `${Math.max((d.count / maxDaily) * 64, 4)}px` }}
                                        />
                                        <span className="text-[9px] text-foreground/30">
                                            {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'narrow' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Engineers */}
                    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={18} className="text-warning" />
                            <h3 className="text-sm font-semibold text-foreground">Team</h3>
                        </div>
                        {loading ? (
                            <Loader2 size={20} className="text-foreground/20 animate-spin mx-auto my-6" />
                        ) : engineers.length === 0 ? (
                            <p className="text-xs text-foreground/30 text-center py-6">No engineers registered</p>
                        ) : (
                            <div className="space-y-2">
                                {engineers.map((eng, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">{eng.display_name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <span className="text-sm text-foreground">{eng.display_name}</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/50 capitalize">{eng.role}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Call Logs */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="font-heading text-lg font-semibold text-foreground">Recent Calls</h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-foreground/40">Loading...</div>
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
                                            <td className="px-6 py-4 text-foreground">{formatDate(call.started_at)}</td>
                                            <td className="px-6 py-4 text-foreground/80 font-mono">{formatDuration(call.duration_seconds)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${call.status === 'completed' ? 'bg-success/10 text-success'
                                                    : call.status === 'active' ? 'bg-primary/10 text-primary'
                                                        : call.status === 'failed' ? 'bg-destructive/10 text-destructive'
                                                            : 'bg-muted text-foreground/50'
                                                    }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {call.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {call.topic_tags?.map((tag) => (
                                                        <span key={tag} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{tag}</span>
                                                    )) ?? <span className="text-foreground/30">—</span>}
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
