import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';

// Validation schema for SSO polling request
const ssoPollSchema = z.object({
  deviceCode: z.string(),
  ssoStartUrl: z.string().url(),
  ssoRegion: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  accountId: z.string().optional(),
  roleName: z.string().optional(),
  username: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ssoPollSchema.parse(body);

    // Import AWS SDK classes directly for polling
    const { SSOOIDCClient, CreateTokenCommand } = await import('@aws-sdk/client-sso-oidc');

    const ssoClient = new SSOOIDCClient({
      region: validatedData.ssoRegion
    });

    try {
      // Poll for token completion using the same client credentials that created the device code
      const command = new CreateTokenCommand({
        clientId: validatedData.clientId,
        clientSecret: validatedData.clientSecret,
        grantType: 'urn:ietf:params:oauth:grant-type:device_code',
        deviceCode: validatedData.deviceCode
      });

      const tokenResponse = await ssoClient.send(command);

      if (tokenResponse.accessToken) {
        // Get user info using the SSO service
        const { createSSOService } = await import('@/lib/sso-service');
        const ssoService = createSSOService({
          startUrl: validatedData.ssoStartUrl,
          region: validatedData.ssoRegion,
          clientName: 'AWS Manager App'
        });

        const token = {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresIn: tokenResponse.expiresIn || 3600,
          tokenType: tokenResponse.tokenType || 'Bearer'
        };

        const userInfo = await ssoService.getUserInfo(
          token.accessToken,
          validatedData.accountId,
          validatedData.roleName
        );

        // Create user object for SSO
        const user = {
          id: userInfo.userId,
          email: userInfo.email || 'sso-user@aws.com',
          name: userInfo.userName,
          authType: 'sso' as const,
          awsRegion: validatedData.ssoRegion,
          awsAccountId: userInfo.accountId,
          permissions: ['s3:read', 's3:write', 's3:delete'],
          awsCredentials: userInfo.awsCredentials,
          ssoToken: {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresIn: token.expiresIn,
            tokenType: token.tokenType
          },
        };

        // Create JWT token with SSO information
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');
        const jwtToken = await new SignJWT({
          userId: user.id,
          email: user.email,
          name: user.name,
          authType: user.authType,
          awsRegion: user.awsRegion,
          awsAccountId: user.awsAccountId,
          permissions: user.permissions,
          awsCredentials: user.awsCredentials,
          ssoToken: user.ssoToken
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(secret);

        // Set secure HTTP-only cookie
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

        response.cookies.set('auth-token', jwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60, // 24 hours
          path: '/',
        });

        return response;
      }

    } catch (pollError: any) {
      if (pollError.message.includes('pending') || pollError.name === 'AuthorizationPendingException') {
        return NextResponse.json({
          success: false,
          pending: true,
          error: 'Authorization still pending'
        }, { status: 202 });
      } else if (pollError.message.includes('expired') || pollError.name === 'ExpiredTokenException') {
        return NextResponse.json({
          success: false,
          expired: true,
          error: 'Device authorization has expired'
        }, { status: 410 });
      } else if (pollError.message.includes('denied') || pollError.name === 'AccessDeniedException') {
        return NextResponse.json({
          success: false,
          denied: true,
          error: 'Access was denied'
        }, { status: 403 });
      } else {
        console.error('SSO polling error:', pollError);
        return NextResponse.json({
          success: false,
          error: 'SSO polling failed',
          details: pollError.message
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('SSO poll error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'SSO polling failed' },
      { status: 500 }
    );
  }
}
