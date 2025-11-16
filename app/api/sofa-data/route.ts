import { NextResponse } from 'next/server';
import { getSofaData } from '@/lib/calculator';

export async function GET() {
  try {
    const data = getSofaData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting sofa data:', error);
    return NextResponse.json(
      { error: 'Failed to get sofa data' },
      { status: 500 }
    );
  }
}

