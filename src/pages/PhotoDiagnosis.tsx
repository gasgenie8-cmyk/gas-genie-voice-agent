import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Camera, Upload, Loader2, AlertTriangle,
    CheckCircle2, XCircle, Info, Wrench, Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage, functions } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

interface DiagnosisResult {
    diagnosis: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    possible_causes: string[];
    next_steps: string[];
    safety_warning: string | null;
    confidence: number;
}

const SEVERITY_CONFIG = {
    low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Low Risk' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Info, label: 'Medium Risk' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle, label: 'High Risk' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Critical' },
};

const PhotoDiagnosis = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<DiagnosisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const resizeImage = async (file: File, maxWidth: number): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                if (img.width <= maxWidth) { resolve(file); return; }
                const scale = maxWidth / img.width;
                const canvas = document.createElement('canvas');
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.85);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        setUploadedFile(file);
        setResult(null);
        setError(null);

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleAnalyze = useCallback(async () => {
        if (!uploadedFile || !user) return;

        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            // 1. Resize and upload to Firebase Storage
            const resized = await resizeImage(uploadedFile, 1200);
            const ext = uploadedFile.name.split('.').pop() || 'jpg';
            const filePath = `diagnose/${user.uid}/${Date.now()}.${ext}`;

            const storageRef = ref(storage, `job-photos/${filePath}`);
            await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
            const publicUrl = await getDownloadURL(storageRef);

            // 2. Call the Cloud Function for analysis
            const analyzePhoto = httpsCallable(functions, 'analyzePhoto');
            const response = await analyzePhoto({ photo_url: publicUrl, user_id: user.uid });

            setResult(response.data as DiagnosisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    }, [uploadedFile, user]);

    const handleAskGenie = () => {
        // Navigate to voice session with diagnosis context
        const context = result ? encodeURIComponent(result.diagnosis) : '';
        navigate(`/voice?context=${context}`);
    };

    const handleReset = () => {
        setPreview(null);
        setUploadedFile(null);
        setResult(null);
        setError(null);
    };

    const SeverityIcon = result ? SEVERITY_CONFIG[result.severity]?.icon || Info : Info;

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-xl font-bold text-foreground">Photo Diagnosis</h1>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Upload area */}
                {!preview ? (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 transition-colors"
                    >
                        <Camera size={48} className="mx-auto text-foreground/20 mb-4" />
                        <p className="text-lg font-heading font-semibold text-foreground/60 mb-1">
                            Upload a photo for diagnosis
                        </p>
                        <p className="text-sm text-foreground/40 mb-6 max-w-xs mx-auto">
                            Take a photo of an error code, boiler display, flue, or installation for AI analysis
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                            >
                                <Camera size={18} /> Take Photo
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) handleFileSelect(file);
                                    };
                                    input.click();
                                }}
                                className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                            >
                                <Upload size={18} /> Upload
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Image preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-border">
                            <img src={preview} alt="Uploaded for diagnosis" className="w-full max-h-[400px] object-contain bg-black/20" />
                            {!analyzing && !result && (
                                <button
                                    onClick={handleReset}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Analyze button */}
                        {!result && !analyzing && (
                            <button
                                onClick={handleAnalyze}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors text-sm"
                            >
                                <Wrench size={18} /> Analyse Photo
                            </button>
                        )}

                        {/* Loading */}
                        {analyzing && (
                            <div className="flex flex-col items-center py-8 animate-fade-in">
                                <Loader2 size={40} className="text-primary animate-spin" />
                                <p className="text-sm text-foreground/60 mt-4 font-medium">Analysing photo...</p>
                                <p className="text-xs text-foreground/30 mt-1">Gas Genie AI is inspecting the image</p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-1">
                                    <XCircle size={16} className="text-destructive" />
                                    <p className="text-sm font-semibold text-destructive">Analysis Failed</p>
                                </div>
                                <p className="text-xs text-destructive/80">{error}</p>
                                <button
                                    onClick={handleAnalyze}
                                    className="mt-3 text-xs font-medium text-destructive hover:text-destructive/80 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Diagnosis result */}
                        {result && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Severity badge */}
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${SEVERITY_CONFIG[result.severity]?.bg || 'bg-muted'}`}>
                                    <SeverityIcon size={22} className={SEVERITY_CONFIG[result.severity]?.color || 'text-foreground'} />
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-wider ${SEVERITY_CONFIG[result.severity]?.color}`}>
                                            {SEVERITY_CONFIG[result.severity]?.label || result.severity}
                                        </p>
                                        <p className="text-xs text-foreground/40 mt-0.5">
                                            Confidence: {Math.round(result.confidence * 100)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div className="bg-card border border-border rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-foreground mb-2">Diagnosis</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{result.diagnosis}</p>
                                </div>

                                {/* Safety warning */}
                                {result.safety_warning && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Safety Warning</p>
                                            <p className="text-sm text-red-300/80">{result.safety_warning}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Possible causes */}
                                {result.possible_causes.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <h3 className="text-sm font-bold text-foreground mb-3">Possible Causes</h3>
                                        <ul className="space-y-2">
                                            {result.possible_causes.map((cause, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                                                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    {cause}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Next steps */}
                                {result.next_steps.length > 0 && (
                                    <div className="bg-card border border-border rounded-xl p-5">
                                        <h3 className="text-sm font-bold text-foreground mb-3">Recommended Next Steps</h3>
                                        <ul className="space-y-2">
                                            {result.next_steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                                                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAskGenie}
                                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
                                    >
                                        <Mic size={16} /> Ask Genie About This
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                                    >
                                        New Photo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Info section */}
                <div className="mt-10 space-y-3">
                    <h2 className="text-xs font-semibold text-foreground/30 uppercase tracking-wider">What can I diagnose?</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Error codes', desc: 'Boiler display codes' },
                            { label: 'Installations', desc: 'Pipework & fittings' },
                            { label: 'Flues & vents', desc: 'Termination points' },
                            { label: 'Appliances', desc: 'Gas appliance issues' },
                        ].map(item => (
                            <div key={item.label} className="bg-card/50 border border-border rounded-xl p-3">
                                <p className="text-xs font-semibold text-foreground/70">{item.label}</p>
                                <p className="text-[11px] text-foreground/40">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PhotoDiagnosis;
