import { useCallback, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, ArrowLeft, Loader2, Calculator, ClipboardCheck,
    Wrench, Briefcase, Copy, Download, Share2
} from 'lucide-react';
import { useVapiVoice } from '../hooks/useVapiVoice';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ToastContainer from '../components/ui/ToastContainer';

const VAPI_ASSISTANT_ID = 'bbbf30c3-e0c0-4223-a5d2-27741dc2dc86';

const QUICK_ASK_CATEGORIES = [
    {
        label: 'Calculators',
        icon: Calculator,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20',
        prompts: [
            'Calculate gas rate',
            'Check pipe sizing',
            'BTU to kW conversion',
            'Ventilation calculation',
            'Pressure drop check',
        ],
    },
    {
        label: 'Compliance',
        icon: ClipboardCheck,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
        prompts: [
            'Log a CP12 record',
            'Record commissioning',
            'Risk assessment',
            'Unsafe situation report',
            'RIDDOR report',
        ],
    },
    {
        label: 'Diagnostics',
        icon: Wrench,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
        prompts: [
            'Diagnose a boiler fault',
            'Boiler specs lookup',
            'Check warranty status',
        ],
    },
    {
        label: 'Business',
        icon: Briefcase,
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20',
        prompts: [
            'Create a quote',
            'Generate an invoice',
            'Log work hours',
            'Log mileage',
            'Check van stock',
        ],
    },
];

const VoiceSession = () => {
    const navigate = useNavigate();
    const { toasts, toast, dismiss } = useToast();
    const { user } = useAuth();
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const callStartRef = useRef<number>(0);
    const [saving, setSaving] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

    const saveTranscript = useCallback(async (transcriptData: { role: string; text: string; isFinal: boolean; timestamp: number }[]) => {
        if (!user || transcriptData.length === 0) return;
        setSaving(true);
        const finalEntries = transcriptData.filter(t => t.isFinal && t.text.trim());
        const duration = callStartRef.current ? Math.round((Date.now() - callStartRef.current) / 1000) : null;
        const summaryParts = finalEntries.slice(0, 3).map(t => t.text.slice(0, 50));
        const summary = summaryParts.join(' | ').slice(0, 200) || null;

        await addDoc(collection(db, 'conversationTranscripts'), {
            user_id: user.uid,
            started_at: new Date(callStartRef.current || Date.now()).toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
            transcript: finalEntries.map(t => ({ role: t.role, text: t.text, timestamp: t.timestamp })),
            summary,
        });
        setSaving(false);
    }, [user]);

    const { status, isActive, transcript, toggleCall, endCall } = useVapiVoice({
        assistantId: VAPI_ASSISTANT_ID,
        onCallEnd: () => {
            saveTranscript(transcript);
            setCallEnded(true);
            toast({ title: 'Call Ended', description: 'Voice session saved.' });
        },
        onError: (error) => {
            toast({
                title: 'Voice Error',
                description: error.message || 'Connection interrupted. Tap the mic to reconnect.',
                variant: 'destructive',
            });
        },
        onStatusChange: (newStatus) => {
            if (newStatus === 'active') {
                callStartRef.current = Date.now();
                setCallEnded(false);
            }
        },
    });

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleToggle = useCallback(async () => {
        try {
            setSelectedPrompt(null);
            await toggleCall();
        } catch (error) {
            toast({
                title: 'Connection Error',
                description: error instanceof Error ? error.message : 'Failed to connect',
                variant: 'destructive',
            });
        }
    }, [toggleCall, toast]);

    const handleQuickAsk = useCallback(async (prompt: string) => {
        setSelectedPrompt(prompt);
        try {
            await toggleCall();
            // The prompt text is shown in the UI as context — the engineer
            // can immediately speak about this topic when the call connects
        } catch (error) {
            toast({
                title: 'Connection Error',
                description: error instanceof Error ? error.message : 'Failed to connect',
                variant: 'destructive',
            });
        }
    }, [toggleCall, toast]);

    const handleBack = () => {
        endCall();
        navigate('/');
    };

    // --- Transcript export utilities ---
    const formatTranscriptText = useCallback(() => {
        const finalEntries = transcript.filter(t => t.isFinal && t.text.trim());
        const header = `Gas Genie — Voice Session Transcript\nDate: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}\n${'─'.repeat(40)}\n\n`;
        const body = finalEntries.map(t =>
            `[${t.role === 'user' ? 'You' : 'Gas Genie'}]\n${t.text}\n`
        ).join('\n');
        return header + body;
    }, [transcript]);

    const handleCopyTranscript = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(formatTranscriptText());
            toast({ title: 'Copied', description: 'Transcript copied to clipboard.' });
        } catch {
            toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
        }
    }, [formatTranscriptText, toast]);

    const handleDownloadTranscript = useCallback(() => {
        const text = formatTranscriptText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gas-genie-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Downloaded', description: 'Transcript saved as text file.' });
    }, [formatTranscriptText, toast]);

    const handleShareTranscript = useCallback(async () => {
        const text = formatTranscriptText();
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Gas Genie Transcript', text });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopyTranscript();
        }
    }, [formatTranscriptText, handleCopyTranscript]);

    const statusLabel: Record<string, string> = {
        idle: 'Tap to speak',
        connecting: 'Connecting...',
        active: 'Listening...',
        ending: 'Ending call...',
    };

    const hasFinalTranscript = transcript.some(t => t.isFinal && t.text.trim());

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <h1 className="font-heading text-lg font-semibold text-foreground">Gas Genie</h1>
                <div className="w-16" />
            </header>

            {/* Transcript Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {transcript.length === 0 && status === 'idle' && !callEnded && (
                    <div className="flex flex-col items-center text-center pt-4 pb-2">
                        <Mic size={40} className="text-primary mb-3 opacity-50" />
                        <p className="text-lg font-heading font-semibold text-foreground/60">Ask Gas Genie anything</p>
                        <p className="text-sm text-foreground/40 mt-1 max-w-xs mb-6">
                            Tap the mic or choose a quick action below
                        </p>

                        {/* Quick-Ask Buttons */}
                        <div className="w-full max-w-md space-y-4">
                            {QUICK_ASK_CATEGORIES.map((cat) => (
                                <div key={cat.label}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <cat.icon size={14} className={cat.color} />
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>
                                            {cat.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {cat.prompts.map((prompt) => (
                                            <button
                                                key={prompt}
                                                onClick={() => handleQuickAsk(prompt)}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${cat.bgColor} text-foreground/80`}
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transcript.length === 0 && status === 'connecting' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={48} className="text-primary animate-spin" />
                        <p className="text-sm text-foreground/60 mt-4">
                            {selectedPrompt
                                ? `Starting: "${selectedPrompt}"...`
                                : 'Connecting to Gas Genie...'}
                        </p>
                    </div>
                )}

                {/* Selected prompt context banner */}
                {selectedPrompt && status === 'active' && transcript.length === 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-center animate-fade-in">
                        <p className="text-xs text-primary/60 font-medium">Quick action</p>
                        <p className="text-sm text-primary font-semibold mt-0.5">"{selectedPrompt}"</p>
                        <p className="text-xs text-foreground/40 mt-1">Speak now to get started</p>
                    </div>
                )}

                {transcript.map((entry, i) => (
                    <div
                        key={i}
                        className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${entry.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-card text-card-foreground border border-border rounded-bl-md'
                                } ${!entry.isFinal ? 'opacity-60' : ''}`}
                        >
                            <p className="text-xs font-medium mb-1 opacity-60">
                                {entry.role === 'user' ? 'You' : 'Gas Genie'}
                            </p>
                            {entry.text}
                        </div>
                    </div>
                ))}
                <div ref={transcriptEndRef} />
            </div>

            {/* Export bar — visible after call ends with transcript */}
            {callEnded && hasFinalTranscript && status === 'idle' && (
                <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-border bg-card/50 animate-fade-in">
                    <span className="text-xs text-foreground/40 font-medium mr-2">Export:</span>
                    <button
                        onClick={handleCopyTranscript}
                        className="flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Copy size={13} /> Copy
                    </button>
                    <button
                        onClick={handleDownloadTranscript}
                        className="flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Download size={13} /> Download
                    </button>
                    <button
                        onClick={handleShareTranscript}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Share2 size={13} /> Share
                    </button>
                </div>
            )}

            {/* Status + Mic Button */}
            <div className="flex flex-col items-center gap-4 px-6 py-8 border-t border-border">
                <p className="text-sm text-foreground/60 font-medium">
                    {saving ? 'Saving transcript...' : statusLabel[status] ?? 'Ready'}
                </p>

                <button
                    onClick={handleToggle}
                    disabled={status === 'ending' || saving}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
            ${isActive
                            ? 'bg-destructive hover:bg-destructive/80 animate-pulse-glow shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                            : status === 'connecting'
                                ? 'bg-warning/20 border-2 border-warning'
                                : 'bg-primary hover:bg-primary-hover animate-pulse-glow'
                        }
            disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isActive ? 'End call' : 'Start call'}
                >
                    {status === 'connecting' ? (
                        <Loader2 size={32} className="text-warning animate-spin" />
                    ) : isActive ? (
                        <MicOff size={32} className="text-white" />
                    ) : (
                        <Mic size={32} className="text-white" />
                    )}
                </button>

                {isActive && (
                    <button
                        onClick={endCall}
                        className="text-sm text-destructive hover:text-destructive/80 font-medium transition-colors"
                    >
                        End session
                    </button>
                )}
            </div>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    );
};

export default VoiceSession;
