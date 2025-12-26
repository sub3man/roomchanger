'use client';

import { useState, useEffect } from 'react';
import ReactCompareImage from 'react-compare-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, RefreshCw, Share2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultViewerProps {
    originalImage: string;
    generatedImage: string | null;
    isLoading?: boolean;
    onRetry?: () => void;
}

export function ResultViewer({
    originalImage,
    generatedImage,
    isLoading = false,
    onRetry,
}: ResultViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleDownload = async () => {
        if (!generatedImage) return;

        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `roomtransform-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleShare = async () => {
        if (!generatedImage) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Room Transformation',
                    text: 'Check out my AI-transformed room!',
                    url: generatedImage,
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(generatedImage);
            alert('Link copied to clipboard!');
        }
    };

    if (isLoading) {
        return (
            <Card className="bg-card/50 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="aspect-[4/3] relative">
                        <img
                            src={originalImage}
                            alt="Original room"
                            className="w-full h-full object-cover opacity-50"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                <div className="absolute inset-2 w-12 h-12 border-4 border-fuchsia-500/30 border-b-fuchsia-500 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
                            </div>
                            <p className="mt-4 text-white font-medium">Transforming your room...</p>
                            <p className="text-sm text-white/60 mt-1">This may take up to 30 seconds</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!generatedImage) {
        return null;
    }

    return (
        <Card className="bg-card/50 backdrop-blur-xl border-white/10 overflow-hidden">
            <CardContent className="p-0">
                {/* Comparison Slider */}
                <div className={cn(
                    "relative",
                    isFullscreen && "fixed inset-0 z-50 bg-black flex items-center justify-center"
                )}>
                    <div className={cn(
                        "w-full",
                        isFullscreen ? "max-w-5xl" : "aspect-[4/3]"
                    )}>
                        <ReactCompareImage
                            leftImage={originalImage}
                            rightImage={generatedImage}
                            leftImageLabel="Before"
                            rightImageLabel="After"
                            sliderLineWidth={3}
                            sliderLineColor="#8B5CF6"
                            handle={
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 cursor-ew-resize">
                                    <div className="w-1 h-5 bg-white rounded-full" />
                                </div>
                            }
                        />
                    </div>

                    {isFullscreen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                        >
                            <Maximize2 className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 flex items-center justify-between border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(true)}
                            className="gap-2"
                        >
                            <Maximize2 className="h-4 w-4" />
                            Fullscreen
                        </Button>
                        {onRetry && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRetry}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                            className="gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <Button
                            onClick={handleDownload}
                            size="sm"
                            className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
