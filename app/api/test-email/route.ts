import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    logger.info(`Testando envio de email para ${email}`);
    
    // Verificar variáveis de ambiente
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS ? '******' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING'
    };

    logger.info('Environment Check:', { metadata: envCheck });

    await sendVerificationEmail({
      to: email,
      name: 'Test User',
      confirmationLink: 'https://example.com/verify'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent',
      env: envCheck
    });
  } catch (error) {
    logger.error('Email test failed', undefined, error as Error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
