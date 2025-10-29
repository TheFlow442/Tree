
import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { ref, get, child, push, set } from 'firebase/database';

// Initialize on the server for the API route
const { database } = initializeFirebase();

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Device-API-Key');
    const body = await request.json();
    
    // Fetch the expected API key from the database
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'app/apiKey'));
    const expectedApiKey = snapshot.exists() ? snapshot.val() : null;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ success: false, error: 'Device API Key is invalid or missing.' }, { status: 401 });
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const energyDataRef = ref(database, 'app/energyData');
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
