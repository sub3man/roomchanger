'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Sofa, UtensilsCrossed, Bed, Bath, Briefcase, Trees } from 'lucide-react';

const ROOM_TYPES = [
    { id: 'living-room', label: 'Living Room', icon: Sofa },
    { id: 'bedroom', label: 'Bedroom', icon: Bed },
    { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
    { id: 'bathroom', label: 'Bathroom', icon: Bath },
    { id: 'office', label: 'Office', icon: Briefcase },
    { id: 'outdoor', label: 'Outdoor', icon: Trees },
];

const STYLES = [
    { id: 'modern', label: 'Modern', color: 'from-blue-500 to-cyan-500' },
    { id: 'minimalist', label: 'Minimalist', color: 'from-gray-500 to-slate-500' },
    { id: 'scandinavian', label: 'Scandinavian', color: 'from-amber-500 to-yellow-500' },
    { id: 'industrial', label: 'Industrial', color: 'from-orange-500 to-red-500' },
    { id: 'bohemian', label: 'Bohemian', color: 'from-pink-500 to-rose-500' },
    { id: 'mid-century', label: 'Mid-Century', color: 'from-emerald-500 to-teal-500' },
    { id: 'japanese', label: 'Japanese', color: 'from-green-500 to-lime-500' },
    { id: 'luxury', label: 'Luxury', color: 'from-violet-500 to-purple-500' },
];

export function StyleSelector() {
    const { selectedStyle, setSelectedStyle, selectedRoomType, setSelectedRoomType } = useAppStore();

    return (
        <div className="space-y-6">
            {/* Room Type Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Room Type</Label>
                <div className="grid grid-cols-3 gap-2">
                    {ROOM_TYPES.map((room) => {
                        const Icon = room.icon;
                        const isSelected = selectedRoomType === room.id;
                        return (
                            <button
                                key={room.id}
                                onClick={() => setSelectedRoomType(room.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                    isSelected
                                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                                        : "border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{room.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Design Style</Label>
                <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((style) => {
                        const isSelected = selectedStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={cn(
                                    "relative flex items-center gap-3 p-3 rounded-xl border transition-all overflow-hidden group",
                                    isSelected
                                        ? "border-violet-500 bg-violet-500/10"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg bg-gradient-to-br shrink-0",
                                    style.color
                                )} />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    isSelected ? "text-violet-300" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {style.label}
                                </span>
                                {isSelected && (
                                    <div className="absolute inset-0 border-2 border-violet-500 rounded-xl pointer-events-none" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
