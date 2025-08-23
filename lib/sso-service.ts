import { 
  SSOOIDCClient, 
  RegisterClientCommand, 
  StartDeviceAuthorizationCommand,
  CreateTokenCommand,
  type RegisterClientCommandOutput,
  type StartDeviceAuthorizationCommandOutput,
  type CreateTokenCommandOutput
} from '@aws-sdk/client-sso-oidc';
import { SSOClient, GetRoleCredentialsCommand, ListAccountsCommand, ListAccountRolesCommand } from '@aws-sdk/client-sso';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export interface SSOConfiguration {
  startUrl: string;
  region: string;
  clientName?: string;
}

export interface DeviceAuthorizationResult {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export interface SSOTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface SSOUserInfo {
  userId: string;
  accountId: string;
  userName: string;
  email?: string;
  roleName?: string;
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  };
}

export class SSOService {
  private ssoClient: SSOOIDCClient;
  private clientInfo: RegisterClientCommandOutput | null = null;

  constructor(private config: SSOConfiguration) {
    this.ssoClient = new SSOOIDCClient({ 
      region: config.region 
    });
  }

  /**
   * Register the SSO client application
   */
  async registerClient(): Promise<RegisterClientCommandOutput> {
    if (this.clientInfo) {
      return this.clientInfo;
    }

    const command = new RegisterClientCommand({
      clientName: this.config.clientName || 'AWS Manager App',
      clientType: 'public',
      scopes: ['sso:account:access']
    });

    this.clientInfo = await this.ssoClient.send(command);
    
    if (!this.clientInfo) {
      throw new Error('Failed to register SSO client');
    }
    
    return this.clientInfo;
  }

  /**
   * Start the device authorization flow
   */
  async startDeviceAuthorization(): Promise<DeviceAuthorizationResult> {
    const clientInfo = await this.registerClient();
    
    if (!clientInfo.clientId || !clientInfo.clientSecret) {
      throw new Error('Failed to register SSO client');
    }

    const command = new StartDeviceAuthorizationCommand({
      clientId: clientInfo.clientId,
      clientSecret: clientInfo.clientSecret,
      startUrl: this.config.startUrl
    });

    const response = await this.ssoClient.send(command);

    if (!response.deviceCode || !response.userCode || !response.verificationUri) {
      throw new Error('Invalid device authorization response');
    }

    return {
      deviceCode: response.deviceCode,
      userCode: response.userCode,
      verificationUri: response.verificationUri,
      verificationUriComplete: response.verificationUriComplete || response.verificationUri,
      expiresIn: response.expiresIn || 600,
      interval: response.interval || 5
    };
  }

  /**
   * Poll for token completion
   */
  async pollForToken(deviceCode: string, interval: number = 5, maxAttempts: number = 120): Promise<SSOTokenResult> {
    const clientInfo = await this.registerClient();
    
    if (!clientInfo.clientId || !clientInfo.clientSecret) {
      throw new Error('Failed to register SSO client');
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const command = new CreateTokenCommand({
          clientId: clientInfo.clientId,
          clientSecret: clientInfo.clientSecret,
          grantType: 'urn:ietf:params:oauth:grant-type:device_code',
          deviceCode: deviceCode
        });

        const response = await this.ssoClient.send(command);

        if (response.accessToken) {
          return {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn || 3600,
            tokenType: response.tokenType || 'Bearer'
          };
        }
      } catch (error: any) {
        if (error.name === 'AuthorizationPendingException') {
          // Authorization is still pending, continue polling
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
          continue;
        } else if (error.name === 'SlowDownException') {
          // Slow down the polling
          interval = Math.min(interval + 5, 30);
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
          continue;
        } else if (error.name === 'ExpiredTokenException') {
          throw new Error('Device authorization has expired. Please try again.');
        } else if (error.name === 'AccessDeniedException') {
          throw new Error('Access denied. Authorization was declined.');
        } else {
          throw error;
        }
      }
    }

    throw new Error('Token polling timed out. Please try again.');
  }

  /**
   * Get available accounts for the user
   */
  async getAvailableAccounts(accessToken: string): Promise<Array<{accountId: string, accountName: string, emailAddress: string}>> {
    const ssoClient = new SSOClient({ region: this.config.region });
    
    try {
      const command = new ListAccountsCommand({
        accessToken
      });
      const response = await ssoClient.send(command);
      
      return (response.accountList || []).map(account => ({
        accountId: account.accountId!,
        accountName: account.accountName!,
        emailAddress: account.emailAddress!
      }));
    } catch (error) {
      console.error('Failed to get available accounts:', error);
      return [];
    }
  }

  /**
   * Get available roles for a specific account
   */
  async getAvailableRoles(accessToken: string, accountId: string): Promise<Array<{roleName: string}>> {
    const ssoClient = new SSOClient({ region: this.config.region });
    
    try {
      const command = new ListAccountRolesCommand({
        accessToken,
        accountId
      });
      const response = await ssoClient.send(command);
      
      return (response.roleList || []).map(role => ({
        roleName: role.roleName!
      }));
    } catch (error) {
      console.error('Failed to get available roles:', error);
      return [];
    }
  }

  /**
   * Get user information and AWS credentials from SSO
   */
  async getUserInfo(accessToken: string, accountId?: string, roleName?: string): Promise<SSOUserInfo> {
    try {
      const ssoClient = new SSOClient({ region: this.config.region });

      // Get available accounts to determine user info
      const accounts = await this.getAvailableAccounts(accessToken);
      
      // Use the first account if none specified, or find the specified account
      let selectedAccount = accounts[0];
      if (accountId) {
        selectedAccount = accounts.find(acc => acc.accountId === accountId) || selectedAccount;
      }

      // If we have an account but no role specified, get the first available role
      let selectedRole = roleName;
      if (selectedAccount && !selectedRole) {
        const roles = await this.getAvailableRoles(accessToken, selectedAccount.accountId);
        selectedRole = roles[0]?.roleName;
      }

      // Get AWS credentials if we have both account and role
      let awsCredentials;
      if (selectedAccount && selectedRole) {
        try {
          const credentialsCommand = new GetRoleCredentialsCommand({
            accountId: selectedAccount.accountId,
            roleName: selectedRole,
            accessToken
          });
          const credentialsResponse = await ssoClient.send(credentialsCommand);

          if (credentialsResponse.roleCredentials) {
            awsCredentials = {
              accessKeyId: credentialsResponse.roleCredentials.accessKeyId!,
              secretAccessKey: credentialsResponse.roleCredentials.secretAccessKey!,
              sessionToken: credentialsResponse.roleCredentials.sessionToken!
            };
          }
        } catch (credError) {
          console.warn('Failed to get role credentials:', credError);
        }
      }

      // Extract username from email address
      const userName = selectedAccount?.emailAddress?.split('@')[0] || 'sso-user';

      return {
        userId: `sso_${userName}_${Date.now()}`,
        accountId: selectedAccount?.accountId || 'unknown',
        userName: userName,
        email: selectedAccount?.emailAddress,
        roleName: selectedRole,
        awsCredentials
      };
    } catch (error) {
      console.warn('Failed to get SSO user info:', error);
      // Fallback to basic user info
      return {
        userId: 'sso_user_' + Date.now(),
        accountId: 'unknown',
        userName: 'SSO User',
        email: 'sso-user@aws.com',
        roleName: undefined,
      };
    }
  }

  /**
   * Complete SSO authentication flow
   */
  async authenticate(): Promise<{
    deviceAuth: DeviceAuthorizationResult;
    pollForCompletion: () => Promise<{ token: SSOTokenResult; userInfo: SSOUserInfo }>;
  }> {
    const deviceAuth = await this.startDeviceAuthorization();

    const pollForCompletion = async () => {
      const token = await this.pollForToken(deviceAuth.deviceCode, deviceAuth.interval);
      const userInfo = await this.getUserInfo(token.accessToken);
      
      return { token, userInfo };
    };

    return {
      deviceAuth,
      pollForCompletion
    };
  }
}

/**
 * Create SSO service instance
 */
export function createSSOService(config: SSOConfiguration): SSOService {
  return new SSOService(config);
}
