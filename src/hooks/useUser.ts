'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase, Profile } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export function useUser() {
    const { setUser } = useAppStore();

    const { data: session, isLoading: isSessionLoading } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            return session;
        },
    });

    const { data: profile, isLoading: isProfileLoading, refetch } = useQuery({
        queryKey: ['profile', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                // Profile might not exist yet, create it
                if (error.code === 'PGRST116') {
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email,
                            credits: 5,
                            is_pro: false,
                        })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    return newProfile as Profile;
                }
                throw error;
            }

            return data as Profile;
        },
        enabled: !!session?.user?.id,
    });

    useEffect(() => {
        setUser(profile || null);
    }, [profile, setUser]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    refetch();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [refetch]);

    return {
        user: session?.user || null,
        profile,
        isLoading: isSessionLoading || isProfileLoading,
        credits: profile?.credits || 0,
        isPro: profile?.is_pro || false,
    };
}
