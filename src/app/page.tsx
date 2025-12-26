'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/UploadZone';
import { StyleSelector } from '@/components/StyleSelector';
import { ResultViewer } from '@/components/ResultViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { useAppStore } from '@/lib/store';
import { Sparkles, Wand2, ArrowRight, CheckCircle, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI-Powered Design',
    description: 'Transform any room with state-of-the-art AI models',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get your redesigned room in seconds, not days',
  },
  {
    icon: Shield,
    title: 'Structure Preserved',
    description: 'ControlNet keeps your room layout intact',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, profile, isLoading: isUserLoading, credits } = useUser();
  const { selectedStyle, selectedRoomType, isGenerating, setIsGenerating } = useAppStore();

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for generation status
  useEffect(() => {
    if (!generationId || !isGenerating) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate?id=${generationId}`);
        const data = await response.json();

        if (data.status === 'completed' && data.generated_image_url) {
          setGeneratedImageUrl(data.generated_image_url);
          setIsGenerating(false);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setError('Generation failed. Please try again.');
          setIsGenerating(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [generationId, isGenerating, setIsGenerating]);

  const handleGenerate = async () => {
    if (!uploadedImageUrl || !user || credits <= 0) return;

    setError(null);
    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          style: selectedStyle,
          roomType: selectedRoomType,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGenerationId(data.id);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleClearImage = () => {
    setUploadedImageUrl(null);
    setGeneratedImageUrl(null);
    setGenerationId(null);
    setError(null);
  };

  const handleRetry = () => {
    setGeneratedImageUrl(null);
    setGenerationId(null);
    setError(null);
    handleGenerate();
  };

  // Show landing page for non-authenticated users
  if (!user && !isUserLoading) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 via-background to-background" />
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 md:mb-8">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-violet-300">AI-Powered Interior Design</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-4 md:mb-6">
                Transform Your Space with{' '}
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  AI Magic
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto px-4">
                Upload a photo of any room and watch as our AI transforms it into your dream interior.
                Choose from 8 stunning styles in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-xl shadow-purple-500/30 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg">
                    Start Transforming
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg">
                    See Examples
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>3 Free Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Instant Results</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="bg-card/50 backdrop-blur-xl border-white/10 hover:border-violet-500/50 transition-colors group"
                  >
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                        <Icon className="h-6 w-6 text-violet-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show main app for authenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Transform Your Room</h1>
          <p className="text-muted-foreground">
            Upload a photo, choose your style, and let AI work its magic
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Settings */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">1. Upload Your Room</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadZone
                  onUploadComplete={setUploadedImageUrl}
                  currentImage={uploadedImageUrl}
                  onClear={handleClearImage}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">2. Choose Your Style</CardTitle>
              </CardHeader>
              <CardContent>
                <StyleSelector />
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={!uploadedImageUrl || isGenerating || credits <= 0}
              className="w-full h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-purple-500/30 text-lg"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : credits <= 0 ? (
                'No Credits Available'
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Transform Room (1 Credit)
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Result */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">3. Your Transformation</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImageUrl || isGenerating ? (
                  <ResultViewer
                    originalImage={uploadedImageUrl!}
                    generatedImage={generatedImageUrl}
                    isLoading={isGenerating}
                    onRetry={handleRetry}
                  />
                ) : (
                  <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-30" />
                    <p className="font-medium">Your transformed room will appear here</p>
                    <p className="text-sm mt-1">Upload an image and click Transform</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
