// Endpoint para debug de tokens recebidos
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  console.log('=== DEBUG TOKEN RECEBIDO ===');
  console.log('URL completa:', request.nextUrl.toString());
  console.log('Query params:', Object.fromEntries(searchParams.entries()));
  console.log('Headers:', {
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  });
  
  // Analisar hash se existir
  const url = new URL(request.nextUrl.toString());
  console.log('Hash fragment:', url.hash);
  
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.substring(1));
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
  }
  
  return NextResponse.json({
    query: Object.fromEntries(searchParams.entries()),
    hash: url.hash,
    hashParams: url.hash ? Object.fromEntries(new URLSearchParams(url.hash.substring(1)).entries()) : {},
    timestamp: new Date().toISOString()
  });
}