'use client';

import { create } from 'zustand';
import { Profile } from './supabase';

interface AppState {
    user: Profile | null;
    setUser: (user: Profile | null) => void;
    isGenerating: boolean;
    setIsGenerating: (isGenerating: boolean) => void;
    selectedStyle: string;
    setSelectedStyle: (style: string) => void;
    selectedRoomType: string;
    setSelectedRoomType: (roomType: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    isGenerating: false,
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    selectedStyle: 'modern',
    setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
    selectedRoomType: 'living-room',
    setSelectedRoomType: (selectedRoomType) => set({ selectedRoomType }),
}));
