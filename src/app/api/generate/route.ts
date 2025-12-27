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

// Helper function to poll Replicate for results
async function pollForResult(url: string, token: string, timeout: number = 30000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const response = await fetch(url, {
            headers: { 'Authorization': `Token ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prediction status');
        }

        const data = await response.json();

        if (data.status === 'succeeded') {
            return data;
        } else if (data.status === 'failed') {
            throw new Error(data.error || 'Prediction failed');
        }

        // Wait 500ms before next poll
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return null;
}

// Style prompts for different design styles
const STYLE_PROMPTS: Record<string, string> = {
    'modern': 'modern contemporary style, clean lines, neutral colors, minimalist furniture',
    'minimalist': 'minimalist style, white walls, simple furniture, zen aesthetic, uncluttered',
    'scandinavian': 'scandinavian style, light wood, cozy textiles, hygge atmosphere, natural light',
    'industrial': 'industrial style, exposed brick, metal accents, Edison bulbs, raw materials',
    'bohemian': 'bohemian style, colorful textiles, plants, eclectic decor, layered patterns',
    'mid-century': 'mid-century modern style, retro furniture, warm wood tones, vintage accents',
    'japanese': 'japanese style, zen minimalism, natural materials, tatami, shoji screens',
    'luxury': 'luxury style, elegant furniture, marble accents, gold details, crystal chandeliers',
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

    return `Beautiful ${stylePrompt} ${roomPrompt}, interior design photograph, professional photography, 8k, high resolution, photorealistic, well-lit, architectural digest quality`;
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
                    generated_image_url: imageUrl, // Return original as demo
                })
                .eq('id', generation.id);

            return NextResponse.json({
                id: generation.id,
                status: 'completed',
                generated_image_url: imageUrl,
                message: 'Demo mode - showing original image',
            });
        }

        // Call Replicate API
        const prompt = buildPrompt(style, roomType);

        let predictionUrl = '';

        try {
            // Use img2img model for room transformation
            const response = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${replicateToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'wait',
                },
                body: JSON.stringify({
                    // SDXL img2img model
                    version: 'a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5',
                    input: {
                        image: imageUrl,
                        prompt: prompt,
                        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, cartoon, anime',
                        num_outputs: 1,
                        guidance_scale: 7.5,
                        prompt_strength: 0.6,
                        num_inference_steps: 25,
                        scheduler: 'K_EULER',
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Replicate API error:', JSON.stringify(errorData));
                throw new Error(`Replicate API error: ${errorData.detail || 'Unknown error'}`);
            }

            const prediction = await response.json();
            predictionUrl = prediction.urls?.get;

            if (!predictionUrl) {
                // If response contains output directly (for 'Prefer: wait')
                if (prediction.output) {
                    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

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
                }
                throw new Error('No prediction URL returned');
            }
        } catch (error: any) {
            console.error('Replicate API error, generation failed:', error.message || error);

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

        // Poll for result (SDXL is usually 10-30 seconds)
        try {
            const result = await pollForResult(predictionUrl, replicateToken, 60000);

            if (result && result.output) {
                const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

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
            }
        } catch (pollError) {
            console.error('Polling error:', pollError);
        }

        // If polling timed out, return processing status (client will poll)
        return NextResponse.json({
            id: generation.id,
            status: 'processing',
        });

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
