import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';
import { CostExplorerClient, GetDimensionValuesCommand, GetRightsizingRecommendationCommand, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';

// Validation schema for billing request
const billingSchema = z.object({
  service: z.string().optional(),
  granularity: z.enum(['DAILY', 'MONTHLY']).optional().default('MONTHLY'),
});

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    throw new Error('No authentication token');
  }

  const decoded = verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
  return decoded;
}

// Helper function to create Cost Explorer client from user credentials
function createCostExplorerClient(user: any) {
  return new CostExplorerClient({
    region: 'us-east-1', // Cost Explorer is only available in us-east-1
    credentials: {
      accessKeyId: user.awsCredentials.accessKeyId,
      secretAccessKey: user.awsCredentials.secretAccessKey,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      service: searchParams.get('service') || undefined,
      granularity: searchParams.get('granularity') || undefined,
    };
    const validatedParams = billingSchema.parse(rawParams);

        // Cost Explorer integration - now enabled with proper permissions!
    
    // Create Cost Explorer client
    const costExplorer = createCostExplorerClient(user);

    // Calculate date range (last 30 days for monthly, last 7 days for daily)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (validatedParams.granularity === 'MONTHLY' ? 30 : 7));

    // Format dates for AWS API (YYYY-MM-DD)
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    // Get cost and usage data
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: start,
        End: end,
      },
      Granularity: validatedParams.granularity,
      Metrics: ['BlendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
      Filter: validatedParams.service ? {
        Dimensions: {
          Key: 'SERVICE',
          Values: [validatedParams.service],
        },
      } : undefined,
    });

    const response = await costExplorer.send(command);

    // Process the response
    let totalCost = 0;
    let s3Cost = 0;
    const breakdown: any[] = [];

    response.ResultsByTime?.forEach((result) => {
      result.Groups?.forEach((group) => {
        const service = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
        
        totalCost += cost;
        if (service.includes('S3') || service.includes('AmazonS3')) {
          s3Cost += cost;
        }
        
        breakdown.push({
          service,
          cost: cost.toFixed(2),
          currency: group.Metrics?.BlendedCost?.Unit || 'USD',
          period: result.TimePeriod,
        });
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCost: totalCost.toFixed(2),
        s3Cost: s3Cost.toFixed(2),
        currency: 'USD',
        period: validatedParams.granularity,
        startDate: start,
        endDate: end,
        breakdown,
      }
    });

  } catch (error: any) {
    console.error('Billing API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: JSON.stringify(error.errors, null, 2),
        errorType: 'ZodError',
        details: 'Ensure your AWS user has Cost Explorer and billing permissions'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.name || 'BillingError',
      details: 'Ensure your AWS user has Cost Explorer and billing permissions',
      stack: error.stack?.split('\n').slice(0, 5) || []
    }, { status: 500 });
  }
}
