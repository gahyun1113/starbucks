import { NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';

export const maxDuration = 60; // Prevent 10s timeout on Vercel Hobby plan

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const aiResult = await analyzeImage(image);
    return NextResponse.json(aiResult);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
