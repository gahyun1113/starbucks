import { NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';

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
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
