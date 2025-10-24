
import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { ref, push, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Device-API-Key');
    const body = await request.json();
    
    // Use the key from environment variables
    const expectedApiKey = process.env.DEVICE_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ success: false, error: 'Device API Key is invalid or missing.' }, { status: 401 });
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { database } = initializeFirebase();

    // Data is no longer user-specific, so we store it in a global path.
    const energyDataRef = ref(database, `app/energyData`);
    const newEnergyDataRef = push(energyDataRef);
    
    await set(newEnergyDataRef, {
        ...body,
        timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Data received successfully.' });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
