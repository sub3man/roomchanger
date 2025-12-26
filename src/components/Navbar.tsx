'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { Sparkles, LogOut, User, Coins, ImageIcon } from 'lucide-react';

export function Navbar() {
    const router = useRouter();
    const { user, profile, isLoading, credits } = useUser();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const getInitials = (email: string | undefined) => {
        if (!email) return 'U';
        return email.charAt(0).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
            <nav className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/30 transition-all group-hover:shadow-purple-500/50">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                        RoomTransform
                    </span>
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                    ) : user ? (
                        <>
                            {/* Credits Indicator */}
                            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 border border-amber-500/30">
                                <Coins className="h-4 w-4 text-amber-400" />
                                <span className="font-medium text-amber-200">
                                    {credits} Credits
                                </span>
                            </div>

                            {/* Gallery Link */}
                            <Link href="/gallery">
                                <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
                                    <ImageIcon className="h-4 w-4" />
                                    Gallery
                                </Button>
                            </Link>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-transparent text-white font-semibold">
                                                {getInitials(user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <div className="flex items-center gap-2 p-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.email}</p>
                                            {profile?.is_pro && (
                                                <Badge variant="secondary" className="w-fit text-xs">PRO</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            {/* Gallery Link for non-authenticated users */}
                            <Link href="/gallery">
                                <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
                                    <ImageIcon className="h-4 w-4" />
                                    Gallery
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-purple-500/30">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
