import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

// Style prompts for different design styles
const STYLE_PROMPTS: Record<string, string> = {
    'modern': 'modern contemporary interior design, clean lines, neutral colors, minimalist furniture, professional',
    'minimalist': 'minimalist interior design, white walls, simple furniture, zen aesthetic, uncluttered, clean',
    'scandinavian': 'scandinavian interior design, light wood, cozy textiles, hygge atmosphere, natural light, warm',
    'industrial': 'industrial interior design, exposed brick, metal accents, Edison bulbs, raw materials, urban',
    'bohemian': 'bohemian interior design, colorful textiles, plants, eclectic decor, layered patterns, artistic',
    'mid-century': 'mid-century modern interior design, retro furniture, warm wood tones, vintage accents, classic',
    'japanese': 'japanese interior design, zen minimalism, natural materials, tatami, shoji screens, peaceful',
    'luxury': 'luxury interior design, elegant furniture, marble accents, gold details, sophisticated, premium',
};

const ROOM_PROMPTS: Record<string, string> = {
    'living-room': 'living room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'office': 'home office',
    'outdoor': 'outdoor patio',
};

function buildPrompt(style: string, roomType: string): string {
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['modern'];
    const roomPrompt = ROOM_PROMPTS[roomType] || 'room';

    return `A beautiful ${stylePrompt} ${roomPrompt}, interior design photograph, professional photography, high resolution, photorealistic, well-lit, architectural digest quality, 4k`;
}

export async function POST(request: NextRequest) {
    const supabase = getSupabaseClient();
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    try {
        const { imageUrl, style, roomType, userId } = await request.json();

        // Validate inputs
        if (!imageUrl || !style || !roomType || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check user credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (profile.credits <= 0) {
            return NextResponse.json(
                { error: 'Insufficient credits' },
                { status: 403 }
            );
        }

        // Create generation record
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .insert({
                user_id: userId,
                original_image_url: imageUrl,
                style,
                room_type: roomType,
                prompt: buildPrompt(style, roomType),
                status: 'processing',
            })
            .select()
            .single();

        if (genError) {
            console.error('Generation insert error:', genError);
            return NextResponse.json(
                { error: 'Failed to create generation record' },
                { status: 500 }
            );
        }

        // Deduct credit
        await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', userId);

        // If Replicate token is not configured, return demo mode response
        if (!replicateToken) {
            console.warn('REPLICATE_API_TOKEN not configured, returning demo response');

            await supabase
                .from('generations')
                .update({
                    status: 'completed',
                    generated_image_url: imageUrl,
                })
                .eq('id', generation.id);

            return NextResponse.json({
                id: generation.id,
                status: 'completed',
                generated_image_url: imageUrl,
                message: 'Demo mode - showing original image',
            });
        }

        // Call Replicate API using the official model format
        const prompt = buildPrompt(style, roomType);

        try {
            // Create prediction using Replicate's predictions API
            const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${replicateToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Using stability-ai/sdxl model
                    version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
                    input: {
                        prompt: prompt,
                        image: imageUrl,
                        num_outputs: 1,
                        guidance_scale: 7.5,
                        prompt_strength: 0.8,
                        num_inference_steps: 30,
                        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad proportions, watermark, text',
                    },
                }),
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                console.error('Replicate create prediction error:', errorText);
                throw new Error(`Replicate API error: ${createResponse.status}`);
            }

            const prediction = await createResponse.json();
            console.log('Prediction created:', prediction.id);

            // Poll for result
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds max

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const statusResponse = await fetch(prediction.urls.get, {
                    headers: {
                        'Authorization': `Token ${replicateToken}`,
                    },
                });

                if (!statusResponse.ok) {
                    console.error('Failed to get prediction status');
                    attempts++;
                    continue;
                }

                const status = await statusResponse.json();
                console.log(`Prediction status (attempt ${attempts + 1}):`, status.status);

                if (status.status === 'succeeded') {
                    const outputUrl = Array.isArray(status.output) ? status.output[0] : status.output;

                    await supabase
                        .from('generations')
                        .update({
                            status: 'completed',
                            generated_image_url: outputUrl,
                        })
                        .eq('id', generation.id);

                    return NextResponse.json({
                        id: generation.id,
                        status: 'completed',
                        generated_image_url: outputUrl,
                    });
                } else if (status.status === 'failed') {
                    console.error('Prediction failed:', status.error);
                    throw new Error(status.error || 'Prediction failed');
                }

                attempts++;
            }

            // Timeout - return processing status
            return NextResponse.json({
                id: generation.id,
                status: 'processing',
            });

        } catch (error: any) {
            console.error('Replicate API error:', error.message);

            await supabase
                .from('generations')
                .update({ status: 'failed' })
                .eq('id', generation.id);

            // Refund credit
            await supabase
                .from('profiles')
                .update({ credits: profile.credits })
                .eq('id', userId);

            return NextResponse.json(
                { error: 'AI generation failed. Please try again.' },
                { status: 500 }
            );
        }

    } catch (error: unknown) {
        console.error('Generation API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('id');

    if (!generationId) {
        return NextResponse.json(
            { error: 'Generation ID required' },
            { status: 400 }
        );
    }

    const { data: generation, error } = await supabase
        .from('generations')
        .select('*')
        .eq('id', generationId)
        .single();

    if (error || !generation) {
        return NextResponse.json(
            { error: 'Generation not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(generation);
}
