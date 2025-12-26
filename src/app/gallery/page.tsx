'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase, Generation } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function formatDate(dateString: string) {
    try {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
        return dateString;
    }
}

const STATUS_BADGES = {
    processing: { label: 'Processing', icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { label: 'Completed', icon: CheckCircle, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    failed: { label: 'Failed', icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function GalleryPage() {
    const { user, isLoading: isUserLoading } = useUser();

    const { data: generations, isLoading } = useQuery({
        queryKey: ['generations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Generation[];
        },
        enabled: !!user?.id,
    });

    if (isUserLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Sign in to view your gallery</h1>
                <p className="text-muted-foreground mb-6">Your past transformations will appear here</p>
                <Link href="/login">
                    <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0">
                        Sign In
                    </Button>
                </Link>
            </div>
        );
    }

    const completedGenerations = generations?.filter(g => g.status === 'completed') || [];
    const processingGenerations = generations?.filter(g => g.status === 'processing') || [];
    const failedGenerations = generations?.filter(g => g.status === 'failed') || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Your Gallery</h1>
                        <p className="text-muted-foreground mt-1">
                            {generations?.length || 0} transformation{(generations?.length || 0) !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/">
                        <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0">
                            New Transformation
                        </Button>
                    </Link>
                </div>

                {!generations?.length ? (
                    <Card className="bg-card/50 backdrop-blur-xl border-white/10">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No transformations yet</h2>
                            <p className="text-muted-foreground mb-6">Start by transforming your first room</p>
                            <Link href="/">
                                <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0">
                                    Transform a Room
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="bg-white/5 border border-white/10">
                            <TabsTrigger value="all" className="data-[state=active]:bg-violet-500">
                                All ({generations?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="data-[state=active]:bg-violet-500">
                                Completed ({completedGenerations.length})
                            </TabsTrigger>
                            <TabsTrigger value="processing" className="data-[state=active]:bg-violet-500">
                                Processing ({processingGenerations.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-6">
                            <GalleryGrid generations={generations || []} />
                        </TabsContent>

                        <TabsContent value="completed" className="mt-6">
                            <GalleryGrid generations={completedGenerations} />
                        </TabsContent>

                        <TabsContent value="processing" className="mt-6">
                            <GalleryGrid generations={processingGenerations} />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}

function GalleryGrid({ generations }: { generations: Generation[] }) {
    if (!generations.length) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No items in this category
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((generation) => {
                const statusInfo = STATUS_BADGES[generation.status] || STATUS_BADGES.processing;
                const StatusIcon = statusInfo.icon;

                return (
                    <Card
                        key={generation.id}
                        className="bg-card/50 backdrop-blur-xl border-white/10 overflow-hidden group hover:border-violet-500/50 transition-colors"
                    >
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                                src={generation.generated_image_url || generation.original_image_url}
                                alt="Room transformation"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <Badge className={`absolute top-3 right-3 ${statusInfo.className}`}>
                                <StatusIcon className={`h-3 w-3 mr-1 ${generation.status === 'processing' ? 'animate-spin' : ''}`} />
                                {statusInfo.label}
                            </Badge>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium capitalize">
                                        {generation.style?.replace('-', ' ')} {generation.room_type?.replace('-', ' ')}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(generation.created_at)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
