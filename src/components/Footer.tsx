'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-background/50 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                            RoomTransform
                        </span>
                    </Link>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/gallery" className="hover:text-foreground transition-colors">
                            Gallery
                        </Link>
                        <Link href="/login" className="hover:text-foreground transition-colors">
                            Login
                        </Link>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline text-xs">
                            Powered by AI
                        </span>
                    </div>

                    {/* Copyright */}
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} RoomTransform. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
