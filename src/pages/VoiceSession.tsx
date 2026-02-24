import { useCallback, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useVapiVoice } from '../hooks/useVapiVoice';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ToastContainer from '../components/ui/ToastContainer';

const VAPI_ASSISTANT_ID = 'bbbf30c3-e0c0-4223-a5d2-27741dc2dc86';

const VoiceSession = () => {
    const navigate = useNavigate();
    const { toasts, toast, dismiss } = useToast();
    const { user } = useAuth();
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const callStartRef = useRef<number>(0);
    const [saving, setSaving] = useState(false);

    const saveTranscript = useCallback(async (transcriptData: { role: string; text: string; isFinal: boolean; timestamp: number }[]) => {
        if (!user || transcriptData.length === 0) return;
        setSaving(true);
        const finalEntries = transcriptData.filter(t => t.isFinal && t.text.trim());
        const duration = callStartRef.current ? Math.round((Date.now() - callStartRef.current) / 1000) : null;
        const summaryParts = finalEntries.slice(0, 3).map(t => t.text.slice(0, 50));
        const summary = summaryParts.join(' | ').slice(0, 200) || null;

        await supabase.from('conversation_transcripts').insert({
            user_id: user.id,
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
            if (newStatus === 'active') callStartRef.current = Date.now();
        },
    });

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleToggle = useCallback(async () => {
        try {
            await toggleCall();
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

    const statusLabel: Record<string, string> = {
        idle: 'Tap to speak',
        connecting: 'Connecting...',
        active: 'Listening...',
        ending: 'Ending call...',
    };

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
                {transcript.length === 0 && status === 'idle' && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                        <Mic size={48} className="text-primary mb-4" />
                        <p className="text-lg font-heading font-semibold">Ask Gas Genie anything</p>
                        <p className="text-sm text-foreground/60 mt-2 max-w-xs">
                            Installation, servicing, regulations, diagnostics — your AI senior engineer is ready.
                        </p>
                    </div>
                )}

                {transcript.length === 0 && status === 'connecting' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={48} className="text-primary animate-spin" />
                        <p className="text-sm text-foreground/60 mt-4">Connecting to Gas Genie...</p>
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
