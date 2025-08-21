import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract AWS credentials
    const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

    if (!decoded.awsCredentials) {
      return NextResponse.json(
        { success: false, error: 'No AWS credentials found in token' },
        { status: 400 }
      );
    }

    // Get current AWS identity
    const stsClient = new STSClient({
      region: decoded.awsRegion || 'us-east-1',
      credentials: {
        accessKeyId: decoded.awsCredentials.accessKeyId,
        secretAccessKey: decoded.awsCredentials.secretAccessKey,
      },
    });

    const identityCommand = new GetCallerIdentityCommand({});
    const identityResponse = await stsClient.send(identityCommand);

    return NextResponse.json({
      success: true,
      identity: {
        userId: identityResponse.UserId,
        account: identityResponse.Account,
        arn: identityResponse.Arn,
        region: decoded.awsRegion,
        username: identityResponse.Arn?.split('/').pop() || 'Unknown',
      },
    });

  } catch (error) {
    console.error('Identity fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AWS identity' },
      { status: 500 }
    );
  }
}
