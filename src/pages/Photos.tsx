import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, X, Image as ImageIcon, Loader2, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
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
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({ usedMB: 0, percentage: 0, isNearFull: false });
    const [cleanupRunning, setCleanupRunning] = useState(false);

    // Fetch photos and calculate storage
    const fetchPhotos = useCallback(async () => {
        if (!user) return;
        const snap = await getDocs(
            query(collection(db, 'jobPhotos'), orderBy('uploaded_at', 'desc'))
        );
        setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Photo[]);
        setLoading(false);
        await calculateStorage();
    }, [user]);

    const calculateStorage = async () => {
        try {
            const storageRef = ref(storage, 'job-photos');
            const result = await listAll(storageRef);
            // Count items (prefixes are subdirectories)
            let totalItems = result.items.length;
            for (const prefix of result.prefixes) {
                const subResult = await listAll(prefix);
                totalItems += subResult.items.length;
            }
            // Approximate 300KB per photo
            const estimatedBytes = totalItems * 300 * 1024;
            const usedMB = Math.round((estimatedBytes / (1024 * 1024)) * 10) / 10;
            const percentage = Math.round((usedMB / STORAGE_LIMIT_MB) * 1000) / 10;
            setStorageInfo({ usedMB, percentage, isNearFull: percentage >= CLEANUP_THRESHOLD * 100 });
        } catch {
            setStorageInfo({ usedMB: 0, percentage: 0, isNearFull: false });
        }
    };

    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

    // Auto-cleanup: delete oldest photos until below target
    const runCleanup = async () => {
        setCleanupRunning(true);
        const snap = await getDocs(
            query(collection(db, 'jobPhotos'), orderBy('uploaded_at', 'asc'))
        );
        const allPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Photo[];

        if (allPhotos.length === 0) { setCleanupRunning(false); return; }

        const targetBytes = CLEANUP_TARGET * STORAGE_LIMIT_MB * 1024 * 1024;
        let currentBytes = storageInfo.usedMB * 1024 * 1024;
        let deletedCount = 0;

        for (const photo of allPhotos) {
            if (currentBytes <= targetBytes) break;
            try {
                await deleteObject(ref(storage, `job-photos/${photo.file_path}`));
                await deleteDoc(doc(db, 'jobPhotos', photo.id));
                currentBytes -= 300 * 1024;
                deletedCount++;
            } catch { /* skip if file already deleted */ }
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

        try {
            await deleteObject(ref(storage, `job-photos/${photo.file_path}`));
        } catch { /* file may already be gone */ }
        await deleteDoc(doc(db, 'jobPhotos', photo.id));

        setDeleting(null);
        if (viewPhoto?.id === photo.id) setViewPhoto(null);
        fetchPhotos();
    };

    // Upload with auto-cleanup check
    const handleUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);

        if (storageInfo.percentage >= CLEANUP_THRESHOLD * 100) {
            await runCleanup();
        }

        const resized = await resizeImage(file, 1200);
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${user.uid}/${Date.now()}.${ext}`;

        try {
            const storageRef = ref(storage, `job-photos/${filePath}`);
            await uploadBytes(storageRef, resized, { contentType: file.type });
            const publicUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'jobPhotos'), {
                file_path: filePath,
                file_url: publicUrl,
                uploaded_by: user.uid,
                description: description || null,
                uploaded_at: new Date().toISOString(),
            });
        } catch (err) {
            alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

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

    const storageBarColor = storageInfo.percentage >= 90 ? 'bg-destructive' : storageInfo.percentage >= 70 ? 'bg-warning' : 'bg-primary';

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
                                Storage: {storageInfo.usedMB} MB / {STORAGE_LIMIT_MB} MB
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {storageInfo.isNearFull && (
                                <span className="flex items-center gap-1 text-[10px] text-warning font-medium">
                                    <AlertTriangle size={12} /> Near capacity
                                </span>
                            )}
                            <span className="text-xs font-mono text-foreground/40">{storageInfo.percentage}%</span>
                        </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${storageBarColor}`}
                            style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                        />
                    </div>
                    {storageInfo.isNearFull && (
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
