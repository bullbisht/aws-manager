import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token' }, { status: 401 });
    }
    
    const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
    
    return NextResponse.json({
      success: true,
      user: decoded,
      hasAwsCredentials: !!decoded.awsCredentials,
      awsCredentialsKeys: decoded.awsCredentials ? Object.keys(decoded.awsCredentials) : [],
      credentialsValid: decoded.awsCredentials ? 
        !!(decoded.awsCredentials.accessKeyId && decoded.awsCredentials.secretAccessKey) : false
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
