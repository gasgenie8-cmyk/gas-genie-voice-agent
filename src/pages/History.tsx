import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, ChevronDown, ChevronUp, Search, X, Copy, Download, Calendar } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface Conversation {
    id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    transcript: { role: string; text: string; timestamp: number }[];
    summary: string | null;
}

const History = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Search & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const constraints = [
                where('user_id', '==', user.uid),
                orderBy('started_at', 'desc'),
                limit(100),
            ];

            const q = query(collection(db, 'conversationTranscripts'), ...constraints);
            const snap = await getDocs(q);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Conversation[];

            // Client-side date filtering
            if (dateFrom) {
                const fromISO = new Date(dateFrom).toISOString();
                results = results.filter(c => c.started_at >= fromISO);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                const toISO = endDate.toISOString();
                results = results.filter(c => c.started_at <= toISO);
            }

            setConversations(results);
            setLoading(false);
        })();
    }, [user, dateFrom, dateTo]);

    // Client-side text search
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(conv => {
            if (conv.summary?.toLowerCase().includes(q)) return true;
            return conv.transcript?.some(t => t.text?.toLowerCase().includes(q));
        });
    }, [conversations, searchQuery]);

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = searchQuery || dateFrom || dateTo;

    // Export helpers
    const formatConversationText = useCallback((conv: Conversation) => {
        const date = new Date(conv.started_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const header = `Gas Genie — Voice Session Transcript\nDate: ${date}\n${'─'.repeat(40)}\n\n`;
        const body = (conv.transcript || [])
            .filter(t => t.text?.trim())
            .map(t => `[${t.role === 'user' ? 'You' : 'Gas Genie'}]\n${t.text}\n`)
            .join('\n');
        return header + body;
    }, []);

    const handleCopy = useCallback(async (conv: Conversation, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(formatConversationText(conv));
            setCopyFeedback(conv.id);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch { /* clipboard unavailable */ }
    }, [formatConversationText]);

    const handleDownload = useCallback((conv: Conversation, e: React.MouseEvent) => {
        e.stopPropagation();
        const text = formatConversationText(conv);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date(conv.started_at).toISOString().slice(0, 10);
        a.download = `gas-genie-transcript-${dateStr}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [formatConversationText]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const formatDuration = (s: number | null) => {
        if (!s) return '-';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-xl font-bold text-foreground flex-1">Conversation History</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground/60 hover:text-foreground'}`}
                >
                    <Calendar size={14} /> Filters
                </button>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-6">
                {/* Search bar */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Date filters */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-card border border-border rounded-xl animate-fade-in">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-foreground/50 font-medium">From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-foreground/50 font-medium">To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-destructive hover:text-destructive/80 font-medium ml-auto"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}

                {/* Results count */}
                {hasActiveFilters && !loading && (
                    <p className="text-xs text-foreground/40 mb-3 font-medium">
                        {filtered.length} conversation{filtered.length !== 1 ? 's' : ''} found
                        {searchQuery && <span> matching "<span className="text-primary">{searchQuery}</span>"</span>}
                    </p>
                )}

                {loading ? (
                    <p className="text-center text-foreground/40 py-12">Loading...</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-foreground/40">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-heading">
                            {hasActiveFilters ? 'No matching conversations' : 'No conversations yet'}
                        </p>
                        <p className="text-sm mt-1">
                            {hasActiveFilters ? 'Try a different search term or date range' : 'Your voice sessions will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((conv) => (
                            <div key={conv.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                                <button
                                    onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-background/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <MessageSquare size={18} className="text-primary shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">{formatDate(conv.started_at)}</p>
                                            <p className="text-xs text-foreground/50 mt-0.5 truncate">
                                                {conv.transcript?.length ?? 0} messages
                                                {conv.summary && ` • ${conv.summary.slice(0, 60)}...`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {/* Export buttons */}
                                        <button
                                            onClick={(e) => handleCopy(conv, e)}
                                            className="p-1.5 rounded-md hover:bg-muted text-foreground/30 hover:text-foreground/60 transition-colors"
                                            title="Copy transcript"
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDownload(conv, e)}
                                            className="p-1.5 rounded-md hover:bg-muted text-foreground/30 hover:text-foreground/60 transition-colors"
                                            title="Download transcript"
                                        >
                                            <Download size={13} />
                                        </button>
                                        <span className="text-xs text-foreground/40 font-mono flex items-center gap-1 ml-1">
                                            <Clock size={12} /> {formatDuration(conv.duration_seconds)}
                                        </span>
                                        {expandedId === conv.id ? <ChevronUp size={16} className="text-foreground/40" /> : <ChevronDown size={16} className="text-foreground/40" />}
                                    </div>
                                </button>

                                {/* Copy feedback toast */}
                                {copyFeedback === conv.id && (
                                    <div className="px-5 py-1.5 bg-primary/10 text-primary text-xs font-medium text-center animate-fade-in">
                                        ✓ Copied to clipboard
                                    </div>
                                )}

                                {expandedId === conv.id && (
                                    <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                                        {(conv.transcript || []).filter((t) => t.text?.trim()).map((entry, i) => (
                                            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${entry.role === 'user'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-muted text-foreground/80'
                                                    }`}>
                                                    <span className="font-medium opacity-60 text-[10px]">{entry.role === 'user' ? 'You' : 'Genie'}</span>
                                                    <p className="mt-0.5">{entry.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default History;

