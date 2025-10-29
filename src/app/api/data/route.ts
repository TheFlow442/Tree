
import { NextResponse, type NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Device-API-Key');
    const body = await request.json();
    
    const { database } = getFirebaseAdmin();

    // Fetch the expected API key from the database
    const appRef = database.ref('app/apiKey');
    const snapshot = await appRef.once('value');
    const expectedApiKey = snapshot.exists() ? snapshot.val() : null;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ success: false, error: 'Device API Key is invalid or missing.' }, { status: 401 });
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const energyDataRef = database.ref('app/energyData');
    const newEnergyDataRef = energyDataRef.push();
    
    await newEnergyDataRef.set({
        ...body,
        timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Data received successfully.' });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
