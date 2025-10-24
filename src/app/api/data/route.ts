
import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { get, ref, child, push, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Device-API-Key');
    const body = await request.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Device API Key is required.' }, { status: 401 });
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { database } = initializeFirebase();
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
        return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 403 });
    }

    let userId: string | null = null;
    usersSnapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        if (userData.apiKey === apiKey) {
            userId = userSnapshot.key;
        }
    });

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid Device API Key.' }, { status: 403 });
    }

    // The device is authenticated, now save its data
    const energyDataRef = ref(database, `users/${userId}/energyData`);
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
