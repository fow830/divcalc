import { NextResponse } from 'next/server';
import { getSofaData } from '@/lib/calculator';

/**
 * GET /api/sofa-data
 * Возвращает данные для калькулятора диванов (фиксированные параметры и модели)
 */
export async function GET() {
  try {
    const data = getSofaData();
    
    // Валидация данных перед отправкой
    if (!data.fixedData || !data.models || !Array.isArray(data.models)) {
      console.error('Invalid data structure:', data);
      return NextResponse.json(
        { error: 'Invalid data structure' },
        { status: 500 }
      );
    }
    
    if (data.models.length === 0) {
      console.error('No models available');
      return NextResponse.json(
        { error: 'No models available' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error getting sofa data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to get sofa data',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

