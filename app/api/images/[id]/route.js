import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const imagesCollection = await getCollection('uploaded_images');
    
    const image = await imagesCollection.findOne({ id });
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Convert base64 back to buffer
    const imageBuffer = Buffer.from(image.data, 'base64');

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': image.mimeType || 'image/png',
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
