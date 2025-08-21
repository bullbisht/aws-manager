import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock user data for demonstration
    const user = {
      id: 'demo_user_123',
      email: 'demo@example.com',
      name: 'Demo User',
      authType: 'credentials',
      awsRegion: body.region || 'ap-south-1',
      awsAccountId: '123456789012',
      permissions: ['s3:read', 's3:write', 's3:delete'],
    };

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      name: user.name,
      authType: user.authType,
      awsRegion: user.awsRegion,
      awsAccountId: user.awsAccountId,
      permissions: user.permissions,
      awsCredentials: {
        accessKeyId: body.accessKeyId || 'DEMO_ACCESS_KEY',
        secretAccessKey: body.secretAccessKey || 'DEMO_SECRET_KEY',
      }
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Set cookie and return user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        authType: user.authType,
        awsRegion: user.awsRegion,
        awsAccountId: user.awsAccountId,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { success: false, error: 'Demo login failed' },
      { status: 401 }
    );
  }
}
