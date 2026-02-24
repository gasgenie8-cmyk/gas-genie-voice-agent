import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, X, Image as ImageIcon, Loader2, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_LIMIT_MB = 1024; // 1 GB free tier
const CLEANUP_THRESHOLD = 0.9; // 90%
const CLEANUP_TARGET = 0.7; // Delete until we're at 70%

interface Photo {
    id: string;
    file_path: string;
    file_url: string;
    description: string | null;
    uploaded_at: string;
    job_id: string | null;
}

interface StorageInfo {
    usedMB: number;
    percentage: number;
    isNearFull: boolean;
}

const Photos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewPhoto, setViewPhoto] = useState<Photo | null>(null);
    const [description, setDescription] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [storage, setStorage] = useState<StorageInfo>({ usedMB: 0, percentage: 0, isNearFull: false });
    const [cleanupRunning, setCleanupRunning] = useState(false);

    // Fetch photos and calculate storage
    const fetchPhotos = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('job_photos')
            .select('*')
            .order('uploaded_at', { ascending: false });
        setPhotos(data ?? []);
        setLoading(false);
        await calculateStorage();
    }, [user]);

    const calculateStorage = async () => {
        // List all files in the bucket to sum their sizes
        const { data: files } = await supabase.storage.from('job-photos').list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'asc' },
        });

        if (!files) { setStorage({ usedMB: 0, percentage: 0, isNearFull: false }); return; }

        // List files in each user folder
        let totalBytes = 0;
        const folders = files.filter(f => !f.metadata); // folders have no metadata
        for (const folder of folders) {
            const { data: userFiles } = await supabase.storage.from('job-photos').list(folder.name, { limit: 1000 });
            if (userFiles) {
                totalBytes += userFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
            }
        }
        // Also count root-level files
        totalBytes += files.filter(f => f.metadata).reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

        const usedMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
        const percentage = Math.round((usedMB / STORAGE_LIMIT_MB) * 1000) / 10;
        setStorage({ usedMB, percentage, isNearFull: percentage >= CLEANUP_THRESHOLD * 100 });
    };

    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

    // Auto-cleanup: delete oldest photos until below target
    const runCleanup = async () => {
        setCleanupRunning(true);
        // Get all photos sorted oldest first
        const { data: allPhotos } = await supabase
            .from('job_photos')
            .select('*')
            .order('uploaded_at', { ascending: true });

        if (!allPhotos || allPhotos.length === 0) { setCleanupRunning(false); return; }

        const targetBytes = CLEANUP_TARGET * STORAGE_LIMIT_MB * 1024 * 1024;
        let currentBytes = storage.usedMB * 1024 * 1024;
        let deletedCount = 0;

        for (const photo of allPhotos) {
            if (currentBytes <= targetBytes) break;

            // Delete from storage
            const { error: storageErr } = await supabase.storage.from('job-photos').remove([photo.file_path]);
            if (!storageErr) {
                // Delete from DB
                await supabase.from('job_photos').delete().eq('id', photo.id);
                // Estimate ~300KB per photo for the counter (we don't have exact sizes here)
                currentBytes -= 300 * 1024;
                deletedCount++;
            }
        }

        setCleanupRunning(false);
        if (deletedCount > 0) {
            alert(`Storage cleanup: ${deletedCount} oldest photo(s) removed to free space.`);
            fetchPhotos();
        }
    };

    // Delete single photo
    const handleDelete = async (photo: Photo, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Delete this photo permanently?')) return;
        setDeleting(photo.id);

        await supabase.storage.from('job-photos').remove([photo.file_path]);
        await supabase.from('job_photos').delete().eq('id', photo.id);

        setDeleting(null);
        if (viewPhoto?.id === photo.id) setViewPhoto(null);
        fetchPhotos();
    };

    // Upload with auto-cleanup check
    const handleUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);

        // Check if cleanup needed before upload
        if (storage.percentage >= CLEANUP_THRESHOLD * 100) {
            await runCleanup();
        }

        const resized = await resizeImage(file, 1200);
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('job-photos')
            .upload(filePath, resized, { contentType: file.type });

        if (uploadError) {
            alert(`Upload failed: ${uploadError.message}`);
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(filePath);

        await supabase.from('job_photos').insert({
            file_path: filePath,
            file_url: publicUrl,
            uploaded_by: user.id,
            description: description || null,
        });

        setDescription('');
        setUploading(false);
        fetchPhotos();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleUpload(file);
    };

    const storageBarColor = storage.percentage >= 90 ? 'bg-destructive' : storage.percentage >= 70 ? 'bg-warning' : 'bg-primary';

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-xl font-bold text-foreground">Job Photos</h1>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Storage Usage Bar */}
                <div className="bg-card border border-border rounded-xl p-4 mb-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <HardDrive size={16} className="text-foreground/50" />
                            <span className="text-xs text-foreground/60 font-medium">
                                Storage: {storage.usedMB} MB / {STORAGE_LIMIT_MB} MB
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {storage.isNearFull && (
                                <span className="flex items-center gap-1 text-[10px] text-warning font-medium">
                                    <AlertTriangle size={12} /> Near capacity
                                </span>
                            )}
                            <span className="text-xs font-mono text-foreground/40">{storage.percentage}%</span>
                        </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${storageBarColor}`}
                            style={{ width: `${Math.min(storage.percentage, 100)}%` }}
                        />
                    </div>
                    {storage.isNearFull && (
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-[11px] text-foreground/40">
                                Oldest photos will be auto-deleted on next upload
                            </p>
                            <button
                                onClick={runCleanup}
                                disabled={cleanupRunning}
                                className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 font-medium transition-colors disabled:opacity-50"
                            >
                                {cleanupRunning ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                {cleanupRunning ? 'Cleaning...' : 'Clean up now'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Upload area */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover:border-primary/50 transition-colors"
                >
                    {uploading ? (
                        <div>
                            <Loader2 size={32} className="mx-auto text-primary animate-spin" />
                            <p className="text-xs text-foreground/40 mt-2">
                                {cleanupRunning ? 'Freeing space...' : 'Uploading...'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Camera size={40} className="mx-auto text-foreground/20 mb-3" />
                            <p className="text-sm text-foreground/50 mb-4">Drag & drop a photo or tap below</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture="environment"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex items-center gap-3 justify-center mb-4">
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description..."
                                    className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary w-64"
                                />
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                >
                                    <Upload size={16} /> Upload Photo
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Photo grid */}
                {loading ? (
                    <p className="text-center text-foreground/40 py-12">Loading...</p>
                ) : photos.length === 0 ? (
                    <div className="text-center py-12 text-foreground/40">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No photos uploaded yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {photos.map((photo) => (
                            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all">
                                <button
                                    onClick={() => setViewPhoto(photo)}
                                    className="w-full h-full"
                                >
                                    <img src={photo.file_url} alt={photo.description || 'Job photo'} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <p className="text-xs text-white truncate">{photo.description || new Date(photo.uploaded_at).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </button>
                                {/* Delete button */}
                                <button
                                    onClick={(e) => handleDelete(photo, e)}
                                    disabled={deleting === photo.id}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete photo"
                                >
                                    {deleting === photo.id
                                        ? <Loader2 size={14} className="text-white animate-spin" />
                                        : <Trash2 size={14} className="text-white" />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox */}
            {viewPhoto && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" onClick={() => setViewPhoto(null)}>
                    <div className="absolute top-6 right-6 flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(viewPhoto); }}
                            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-destructive transition-colors"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        <button className="text-white/70 hover:text-white" onClick={() => setViewPhoto(null)}>
                            <X size={24} />
                        </button>
                    </div>
                    <img src={viewPhoto.file_url} alt={viewPhoto.description || ''} className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
                    {viewPhoto.description && (
                        <p className="absolute bottom-8 text-sm text-white/80 text-center">{viewPhoto.description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

async function resizeImage(file: File, maxWidth: number): Promise<Blob> {
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
            canvas.toBlob((blob) => resolve(blob || file), file.type, 0.85);
        };
        img.src = URL.createObjectURL(file);
    });
}

export default Photos;
