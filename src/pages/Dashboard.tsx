import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mic, Camera, Clock, FileText, Truck, Package,
    AlertTriangle, TrendingUp, ChevronRight, Loader2, Route as RouteIcon
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { generateCP12PDF, generateQuotePDF, generateInvoicePDF } from '../lib/generateCompliancePDF';

interface DashboardStats {
    todayJobs: number;
    todayHours: number;
    todayMileage: number;
    lowStockItems: { item_name: string; quantity: number; min_stock: number }[];
    recentQuotes: { id: string; quote_number: string; total: number; status: string; created_at: string }[];
    recentInvoices: { id: string; invoice_number: string; total: number; status: string; created_at: string }[];
    recentCP12s: { id: string; property_address: string; overall_result: string; inspection_date: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    Draft: 'text-foreground/50 bg-foreground/5',
    Sent: 'text-cyan-400 bg-cyan-500/10',
    Accepted: 'text-emerald-400 bg-emerald-500/10',
    Rejected: 'text-red-400 bg-red-500/10',
    Unpaid: 'text-amber-400 bg-amber-500/10',
    Paid: 'text-emerald-400 bg-emerald-500/10',
    Overdue: 'text-red-400 bg-red-500/10',
    Pass: 'text-emerald-400 bg-emerald-500/10',
    Fail: 'text-red-400 bg-red-500/10',
    'At Risk': 'text-amber-400 bg-amber-500/10',
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        todayJobs: 0, todayHours: 0, todayMileage: 0,
        lowStockItems: [], recentQuotes: [], recentInvoices: [], recentCP12s: [],
    });

    useEffect(() => {
        if (!user) return;
        (async () => {
            const today = new Date().toISOString().slice(0, 10);

            const uid = user.uid;

            const [hoursSnap, mileageSnap, stockSnap, quotesSnap, invoicesSnap, cp12Snap] = await Promise.all([
                getDocs(query(collection(db, 'workHours'), where('engineer_id', '==', uid), where('created_at', '>=', today))),
                getDocs(query(collection(db, 'mileageLogs'), where('engineer_id', '==', uid), where('created_at', '>=', today))),
                getDocs(query(collection(db, 'vanInventory'), where('engineer_id', '==', uid))),
                getDocs(query(collection(db, 'quotes'), orderBy('created_at', 'desc'), limit(5))),
                getDocs(query(collection(db, 'invoices'), orderBy('created_at', 'desc'), limit(5))),
                getDocs(query(collection(db, 'cp12Records'), where('engineer_id', '==', uid), orderBy('created_at', 'desc'), limit(5))),
            ]);

            const hoursData = hoursSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const mileageData = mileageSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const stockData = stockSnap.docs.map(d => d.data() as { item_name: string; quantity: number; min_stock: number });

            const totalHours = hoursData.reduce((sum, r) => sum + ((r as Record<string, number>).hours || 0), 0);
            const totalMiles = mileageData.reduce((sum, r) => sum + ((r as Record<string, number>).miles || 0), 0);
            const lowStock = stockData.filter(i => i.quantity <= i.min_stock);

            setStats({
                todayJobs: hoursData.length,
                todayHours: Math.round(totalHours * 10) / 10,
                todayMileage: Math.round(totalMiles * 10) / 10,
                lowStockItems: lowStock,
                recentQuotes: quotesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DashboardStats['recentQuotes'],
                recentInvoices: invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DashboardStats['recentInvoices'],
                recentCP12s: cp12Snap.docs.map(d => ({ id: d.id, ...d.data() })) as DashboardStats['recentCP12s'],
            });
            setLoading(false);
        })();
    }, [user]);

    const handleGenerateCP12PDF = useCallback(async (recordId: string) => {
        const snap = await getDoc(doc(db, 'cp12Records', recordId));
        if (snap.exists()) generateCP12PDF({ id: snap.id, ...snap.data() });
    }, []);

    const handleGenerateQuotePDF = useCallback(async (quoteId: string) => {
        const snap = await getDoc(doc(db, 'quotes', quoteId));
        if (snap.exists()) generateQuotePDF({ id: snap.id, ...snap.data() });
    }, []);

    const handleGenerateInvoicePDF = useCallback(async (invoiceId: string) => {
        const snap = await getDoc(doc(db, 'invoices', invoiceId));
        if (snap.exists()) generateInvoicePDF({ id: snap.id, ...snap.data() });
    }, []);

    const quickActions = [
        { label: 'Voice', icon: Mic, color: 'bg-primary', path: '/voice' },
        { label: 'Diagnose', icon: Camera, color: 'bg-amber-500', path: '/diagnose' },
        { label: 'History', icon: Clock, color: 'bg-cyan-500', path: '/history' },
        { label: 'Photos', icon: FileText, color: 'bg-violet-500', path: '/photos' },
    ];

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
                <h1 className="font-heading text-xl font-bold text-foreground">Dashboard</h1>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-3">
                    {quickActions.map(a => (
                        <button
                            key={a.label}
                            onClick={() => navigate(a.path)}
                            className="flex flex-col items-center gap-2 bg-card border border-border rounded-xl py-4 hover:bg-card/80 transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-full ${a.color} flex items-center justify-center`}>
                                <a.icon size={18} className="text-white" />
                            </div>
                            <span className="text-xs font-medium text-foreground/70">{a.label}</span>
                        </button>
                    ))}
                </div>

                {/* Today's Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-primary" />
                            <span className="text-xs font-medium text-foreground/40">Today</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.todayJobs}</p>
                        <p className="text-xs text-foreground/40">jobs logged</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-cyan-400" />
                            <span className="text-xs font-medium text-foreground/40">Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.todayHours}</p>
                        <p className="text-xs text-foreground/40">hours worked</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <RouteIcon size={14} className="text-violet-400" />
                            <span className="text-xs font-medium text-foreground/40">Miles</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.todayMileage}</p>
                        <p className="text-xs text-foreground/40">miles driven</p>
                    </div>
                </div>

                {/* Van Stock Alerts */}
                {stats.lowStockItems.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-amber-400" />
                            <h3 className="text-sm font-bold text-amber-400">Low Van Stock</h3>
                        </div>
                        <div className="space-y-2">
                            {stats.lowStockItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-foreground/70">{item.item_name}</span>
                                    <span className="text-xs font-mono text-amber-400">
                                        {item.quantity} / {item.min_stock} min
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Quotes */}
                <Section title="Recent Quotes" icon={FileText}>
                    {stats.recentQuotes.length === 0 ? (
                        <EmptyState text="No quotes yet — ask Genie to create one" />
                    ) : (
                        stats.recentQuotes.map(q => (
                            <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{q.quote_number}</p>
                                    <p className="text-xs text-foreground/40">{new Date(q.created_at).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status] || ''}`}>
                                        {q.status}
                                    </span>
                                    <span className="text-sm font-bold text-foreground">£{q.total?.toFixed(2)}</span>
                                    <button onClick={() => handleGenerateQuotePDF(q.id)} className="text-foreground/30 hover:text-primary transition-colors" title="Download PDF">
                                        <FileText size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </Section>

                {/* Recent Invoices */}
                <Section title="Recent Invoices" icon={Truck}>
                    {stats.recentInvoices.length === 0 ? (
                        <EmptyState text="No invoices yet" />
                    ) : (
                        stats.recentInvoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                                    <p className="text-xs text-foreground/40">{new Date(inv.created_at).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] || ''}`}>
                                        {inv.status}
                                    </span>
                                    <span className="text-sm font-bold text-foreground">£{inv.total?.toFixed(2)}</span>
                                    <button onClick={() => handleGenerateInvoicePDF(inv.id)} className="text-foreground/30 hover:text-primary transition-colors" title="Download PDF">
                                        <FileText size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </Section>

                {/* CP12 Records */}
                <Section title="Gas Safety Records (CP12)" icon={Package}>
                    {stats.recentCP12s.length === 0 ? (
                        <EmptyState text="No CP12s yet — ask Genie to log one" />
                    ) : (
                        stats.recentCP12s.map(cp => (
                            <div key={cp.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{cp.property_address || 'No address'}</p>
                                    <p className="text-xs text-foreground/40">{cp.inspection_date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[cp.overall_result] || ''}`}>
                                        {cp.overall_result}
                                    </span>
                                    <button onClick={() => handleGenerateCP12PDF(cp.id)} className="text-foreground/30 hover:text-primary transition-colors" title="Download PDF">
                                        <FileText size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </Section>
            </main>
        </div>
    );
};

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            <ChevronRight size={14} className="text-foreground/20" />
        </div>
        <div className="px-5 py-2">{children}</div>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <p className="text-xs text-foreground/30 py-4 text-center">{text}</p>
);

export default Dashboard;
