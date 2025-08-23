import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';

// Validation schema for login request
const loginSchema = z.object({
  authType: z.enum(['credentials', 'sso']),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  region: z.string().default('us-east-1'),
  ssoStartUrl: z.string().url().optional(),
  ssoRegion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    if (validatedData.authType === 'credentials') {
      // Validate AWS credentials by testing them
      try {
        const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
        
        const stsClient = new STSClient({
          region: validatedData.region,
          credentials: {
            accessKeyId: validatedData.accessKeyId!,
            secretAccessKey: validatedData.secretAccessKey!,
          },
        });

        // Test credentials by calling GetCallerIdentity
        const identityCommand = new GetCallerIdentityCommand({});
        const identityResponse = await stsClient.send(identityCommand);

        // If we get here, credentials are valid
        const user = {
          id: identityResponse.UserId || 'user_' + Date.now(),
          email: identityResponse.Arn || 'aws-user@aws.com',
          name: identityResponse.Arn?.split('/').pop() || 'AWS User',
          authType: validatedData.authType,
          awsRegion: validatedData.region,
          awsAccountId: identityResponse.Account,
          permissions: ['s3:read', 's3:write', 's3:delete'],
          awsCredentials: {
            accessKeyId: validatedData.accessKeyId!,
            secretAccessKey: validatedData.secretAccessKey!,
          },
        };

        // Create JWT token with AWS credentials using jose library
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');
        const token = await new SignJWT({ 
          userId: user.id, 
          email: user.email,
          name: user.name,
          authType: user.authType,
          awsRegion: user.awsRegion,
          awsAccountId: user.awsAccountId,
          permissions: user.permissions,
          awsCredentials: user.awsCredentials
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(secret);

        // Set secure HTTP-only cookie using NextResponse
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

      } catch (awsError: any) {
        console.error('AWS credential validation failed:', awsError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid AWS credentials',
            details: awsError.name === 'InvalidUserException' || awsError.name === 'UnrecognizedClientException' 
              ? 'The provided AWS credentials are invalid'
              : 'Unable to validate AWS credentials'
          },
          { status: 401 }
        );
      }
    } else {
      // SSO authentication using AWS SSO
      try {
        const { createSSOService } = await import('@/lib/sso-service');
        
        const ssoService = createSSOService({
          startUrl: validatedData.ssoStartUrl!,
          region: validatedData.ssoRegion || validatedData.region,
          clientName: 'AWS Manager App'
        });

        const { deviceAuth, pollForCompletion } = await ssoService.authenticate();
        
        // Store device auth info in session/cache for polling
        // For simplicity, we'll return the device auth info to the client
        return NextResponse.json({
          success: true,
          requiresDeviceAuth: true,
          deviceAuth: {
            userCode: deviceAuth.userCode,
            verificationUri: deviceAuth.verificationUri,
            verificationUriComplete: deviceAuth.verificationUriComplete,
            expiresIn: deviceAuth.expiresIn,
            interval: deviceAuth.interval
          },
          // Return a polling endpoint URL
          pollEndpoint: '/api/auth/sso-poll',
          deviceCode: deviceAuth.deviceCode // This should be stored securely in a real app
        });

      } catch (ssoError: any) {
        console.error('SSO authentication failed:', ssoError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'SSO authentication failed',
            details: ssoError.message || 'Unable to initiate SSO authentication'
          },
          { status: 401 }
        );
      }
    }

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
