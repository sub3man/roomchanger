'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
    onUploadComplete: (url: string) => void;
    currentImage?: string | null;
    onClear?: () => void;
}

// Resize image to max width while maintaining aspect ratio
async function resizeImage(file: File, maxWidth: number = 1024): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to resize image'));
                },
                'image/jpeg',
                0.9
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

export function UploadZone({ onUploadComplete, currentImage, onClear }: UploadZoneProps) {
    const { user } = useUser();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 10MB before resize)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);

            // Resize image
            const resizedBlob = await resizeImage(file);

            // Generate unique filename
            const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, resizedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(data.path);

            onUploadComplete(publicUrl);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    }, [user, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxFiles: 1,
        disabled: isUploading,
    });

    const handleClear = () => {
        setPreview(null);
        setError(null);
        onClear?.();
    };

    if (preview) {
        return (
            <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                <img
                    src={preview}
                    alt="Uploaded room"
                    className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute top-3 right-3 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X className="h-4 w-4" />
                </Button>
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={cn(
                    "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
                    "flex flex-col items-center justify-center aspect-[4/3]",
                    isDragActive
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/20 hover:border-violet-500/50 bg-white/5 hover:bg-white/10",
                    isUploading && "pointer-events-none opacity-50"
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                        isDragActive ? "bg-violet-500/20" : "bg-white/10"
                    )}>
                        {isDragActive ? (
                            <ImageIcon className="h-8 w-8 text-violet-400" />
                        ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>

                    <div>
                        <p className="font-medium text-foreground">
                            {isDragActive ? "Drop your image here" : "Drag & drop your room photo"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            or click to browse (JPEG, PNG, WebP)
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        className="bg-white/10 hover:bg-white/20"
                        disabled={isUploading}
                    >
                        Select Image
                    </Button>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
            )}
        </div>
    );
}
