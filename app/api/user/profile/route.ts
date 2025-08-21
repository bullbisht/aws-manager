import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        authType: decoded.authType,
        awsRegion: decoded.awsRegion,
        awsAccountId: decoded.awsAccountId,
        permissions: decoded.permissions,
      },
    });

  } catch (error) {
    console.error('Profile verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
