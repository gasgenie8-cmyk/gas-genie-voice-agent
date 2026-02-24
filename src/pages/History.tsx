import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
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

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data } = await supabase
                .from('conversation_transcripts')
                .select('*')
                .eq('user_id', user.id)
                .order('started_at', { ascending: false })
                .limit(50);
            setConversations(data ?? []);
            setLoading(false);
        })();
    }, [user]);

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
                <h1 className="font-heading text-xl font-bold text-foreground">Conversation History</h1>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                {loading ? (
                    <p className="text-center text-foreground/40 py-12">Loading...</p>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-16 text-foreground/40">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-heading">No conversations yet</p>
                        <p className="text-sm mt-1">Your voice sessions will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {conversations.map((conv) => (
                            <div key={conv.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                                <button
                                    onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-background/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={18} className="text-primary shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{formatDate(conv.started_at)}</p>
                                            <p className="text-xs text-foreground/50 mt-0.5">
                                                {conv.transcript?.length ?? 0} messages
                                                {conv.summary && ` • ${conv.summary.slice(0, 60)}...`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-foreground/40 font-mono flex items-center gap-1">
                                            <Clock size={12} /> {formatDuration(conv.duration_seconds)}
                                        </span>
                                        {expandedId === conv.id ? <ChevronUp size={16} className="text-foreground/40" /> : <ChevronDown size={16} className="text-foreground/40" />}
                                    </div>
                                </button>

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
