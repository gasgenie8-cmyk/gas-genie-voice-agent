import { useState, useCallback, useRef, useEffect } from 'react';

type VapiStatus = 'idle' | 'connecting' | 'active' | 'ending';

interface TranscriptEntry {
    role: 'user' | 'assistant';
    text: string;
    isFinal: boolean;
    timestamp: number;
}

interface UseVapiVoiceOptions {
    assistantId: string;
    onTranscript?: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
    onCallEnd?: () => void;
    onError?: (error: Error) => void;
    onStatusChange?: (status: VapiStatus) => void;
}

interface UseVapiVoiceReturn {
    status: VapiStatus;
    isActive: boolean;
    transcript: TranscriptEntry[];
    toggleCall: () => Promise<void>;
    endCall: () => void;
}

export function useVapiVoice({
    assistantId,
    onTranscript,
    onCallEnd,
    onError,
    onStatusChange,
}: UseVapiVoiceOptions): UseVapiVoiceReturn {
    const [status, setStatus] = useState<VapiStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const vapiRef = useRef<any>(null);

    const updateStatus = useCallback(
        (newStatus: VapiStatus) => {
            setStatus(newStatus);
            onStatusChange?.(newStatus);
        },
        [onStatusChange],
    );

    const endCall = useCallback(() => {
        if (vapiRef.current) {
            try {
                vapiRef.current.stop();
            } catch {
                // Call may already be ended
            }
            vapiRef.current = null;
        }
        updateStatus('idle');
    }, [updateStatus]);

    const toggleCall = useCallback(async () => {
        if (status === 'active' || status === 'connecting') {
            endCall();
            return;
        }

        try {
            updateStatus('connecting');
            setTranscript([]);

            const { default: Vapi } = await import('@vapi-ai/web');
            const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

            if (!publicKey) {
                throw new Error('Vapi public key not configured');
            }

            const vapi = new Vapi(publicKey);
            vapiRef.current = vapi;

            vapi.on('call-start', () => {
                updateStatus('active');
            });

            vapi.on('call-end', () => {
                updateStatus('idle');
                vapiRef.current = null;
                onCallEnd?.();
            });

            vapi.on('message', (message: any) => {
                if (message.type === 'transcript') {
                    const role = message.role === 'assistant' ? 'assistant' : 'user';
                    const entry: TranscriptEntry = {
                        role,
                        text: message.transcript,
                        isFinal: message.transcriptType === 'final',
                        timestamp: Date.now(),
                    };

                    setTranscript((prev) => {
                        if (!entry.isFinal && prev.length > 0) {
                            const last = prev[prev.length - 1];
                            if (last && !last.isFinal && last.role === role) {
                                return [...prev.slice(0, -1), entry];
                            }
                        }
                        return [...prev, entry];
                    });

                    onTranscript?.(message.transcript, message.transcriptType === 'final', role);
                }
            });

            vapi.on('error', (error: any) => {
                console.error('[VapiVoice]', error);
                let message = 'Voice connection failed';
                if (error instanceof Error) {
                    message = error.message;
                } else if (typeof error === 'object' && error !== null) {
                    message = error.error?.message || error.message || error.error?.statusMessage || 'Voice connection failed. Please check your settings.';
                } else if (typeof error === 'string') {
                    message = error;
                }
                onError?.(new Error(message));
                endCall();
            });

            await vapi.start(assistantId);
        } catch (error) {
            console.error('[VapiVoice:start]', error);
            onError?.(error instanceof Error ? error : new Error('Failed to start voice session'));
            updateStatus('idle');
        }
    }, [status, assistantId, endCall, updateStatus, onTranscript, onCallEnd, onError]);

    useEffect(() => {
        return () => {
            if (vapiRef.current) {
                try {
                    vapiRef.current.stop();
                } catch {
                    // Cleanup
                }
            }
        };
    }, []);

    return {
        status,
        isActive: status === 'active',
        transcript,
        toggleCall,
        endCall,
    };
}
