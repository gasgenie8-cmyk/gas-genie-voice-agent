import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Photo {
    id: string;
    file_url: string;
    description: string | null;
    uploaded_at: string;
    job_id: string | null;
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

    const fetchPhotos = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('job_photos')
            .select('*')
            .eq('uploaded_by', user.id)
            .order('uploaded_at', { ascending: false });
        setPhotos(data ?? []);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

    const handleUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);

        // Resize if needed
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

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-xl font-bold text-foreground">Job Photos</h1>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Upload area */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover:border-primary/50 transition-colors"
                >
                    {uploading ? (
                        <Loader2 size={32} className="mx-auto text-primary animate-spin" />
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
                            <button
                                key={photo.id}
                                onClick={() => setViewPhoto(photo)}
                                className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all"
                            >
                                <img src={photo.file_url} alt={photo.description || 'Job photo'} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <p className="text-xs text-white truncate">{photo.description || new Date(photo.uploaded_at).toLocaleDateString('en-GB')}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox */}
            {viewPhoto && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" onClick={() => setViewPhoto(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white" onClick={() => setViewPhoto(null)}>
                        <X size={24} />
                    </button>
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
