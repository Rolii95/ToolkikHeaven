import { NextRequest, NextResponse } from 'next/server';
import { 
  GDPRCompliance, 
  DataSubjectRights, 
  DataCategory, 
  LegalBasis 
} from '../../../lib/security/gdpr';
import { FraudDetection } from '../../../lib/security/fraud';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  try {
    switch (action) {
      case 'consent-status':
        return await getConsentStatus(userId!);
      
      case 'data-requests':
        return await getDataSubjectRequests(userId || undefined);
      
      case 'export-data':
        return await exportUserData(userId!);
      
      case 'fraud-stats':
        return await getFraudStatistics();
      
      case 'security-events':
        return await getSecurityEvents(userId || undefined);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'grant-consent':
        return await grantConsent(body, request);
      
      case 'withdraw-consent':
        return await withdrawConsent(body);
      
      case 'submit-data-request':
        return await submitDataRequest(body);
      
      case 'process-data-request':
        return await processDataRequest(body);
      
      case 'assess-fraud':
        return await assessFraudRisk(body, request);
      
      case 'block-entity':
        return await blockEntity(body);
      
      case 'report-breach':
        return await reportDataBreach(body);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GDPR Consent Management
async function grantConsent(body: {
  userId: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  expiresInDays?: number;
}, request: NextRequest) {
  const { userId, purpose, legalBasis, dataCategories, expiresInDays } = body;

  if (!userId || !purpose || !legalBasis || !dataCategories) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const consent = await GDPRCompliance.recordConsent(
      userId,
      purpose,
      legalBasis,
      dataCategories,
      request,
      expiresInDays
    );

    return NextResponse.json({
      success: true,
      data: {
        consentId: consent.id,
        granted: consent.granted,
        timestamp: consent.timestamp,
        expiresAt: consent.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to record consent',
    }, { status: 500 });
  }
}

async function withdrawConsent(body: { userId: string; purpose: string }) {
  const { userId, purpose } = body;

  if (!userId || !purpose) {
    return NextResponse.json(
      { success: false, error: 'User ID and purpose are required' },
      { status: 400 }
    );
  }

  try {
    const withdrawn = await GDPRCompliance.withdrawConsent(userId, purpose);

    return NextResponse.json({
      success: withdrawn,
      data: {
        userId,
        purpose,
        withdrawnAt: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to withdraw consent',
    }, { status: 500 });
  }
}

async function getConsentStatus(userId: string) {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // Check consent for common purposes
    const purposes = ['marketing', 'analytics', 'personalization', 'data_processing'];
    const consentStatus = await Promise.all(
      purposes.map(async (purpose) => ({
        purpose,
        granted: await GDPRCompliance.checkConsent(userId, purpose),
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        userId,
        consents: consentStatus,
        checkedAt: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check consent status',
    }, { status: 500 });
  }
}

// Data Subject Rights
async function submitDataRequest(body: {
  userId: string;
  email: string;
  requestType: DataSubjectRights;
  description?: string;
}) {
  const { userId, email, requestType, description } = body;

  if (!userId || !email || !requestType) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const request = await GDPRCompliance.submitDataSubjectRequest(
      userId,
      email,
      requestType,
      description
    );

    return NextResponse.json({
      success: true,
      data: {
        requestId: request.id,
        status: request.status,
        requestType: request.requestType,
        submittedAt: request.requestedAt,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to submit data subject request',
    }, { status: 500 });
  }
}

async function processDataRequest(body: {
  requestId: string;
  processedBy: string;
  response: string;
  status: 'completed' | 'rejected';
}) {
  const { requestId, processedBy, response, status } = body;

  if (!requestId || !processedBy || !response || !status) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const processed = await GDPRCompliance.processDataSubjectRequest(
      requestId,
      processedBy,
      response,
      status
    );

    return NextResponse.json({
      success: processed,
      data: {
        requestId,
        status,
        processedBy,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process data subject request',
    }, { status: 500 });
  }
}

async function getDataSubjectRequests(userId?: string) {
  try {
    // In real implementation, this would query stored requests
    // For now, return mock data
    const requests = [
      {
        id: 'dsr_123',
        userId: userId || 'user123',
        requestType: DataSubjectRights.ACCESS,
        status: 'completed',
        requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'dsr_124',
        userId: userId || 'user456',
        requestType: DataSubjectRights.ERASURE,
        status: 'pending',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    const filteredRequests = userId 
      ? requests.filter(req => req.userId === userId)
      : requests;

    return NextResponse.json({
      success: true,
      data: {
        requests: filteredRequests,
        total: filteredRequests.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get data subject requests',
    }, { status: 500 });
  }
}

async function exportUserData(userId: string) {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const userData = await GDPRCompliance.exportUserData(userId);

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to export user data',
    }, { status: 500 });
  }
}

// Data Breach Management
async function reportDataBreach(body: {
  description: string;
  affectedUsers: string[];
  dataCategories: DataCategory[];
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
}) {
  const { description, affectedUsers, dataCategories, severity, reportedBy } = body;

  if (!description || !affectedUsers || !dataCategories || !severity || !reportedBy) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const breachId = await GDPRCompliance.reportDataBreach(
      description,
      affectedUsers,
      dataCategories,
      severity,
      reportedBy
    );

    return NextResponse.json({
      success: true,
      data: {
        breachId,
        severity,
        affectedUserCount: affectedUsers.length,
        reportedAt: new Date(),
        requiresAuthorityNotification: severity === 'high' || affectedUsers.length > 100,
        requiresUserNotification: severity !== 'low',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to report data breach',
    }, { status: 500 });
  }
}

// Fraud Detection
async function assessFraudRisk(body: {
  userId?: string;
  transactionAmount?: number;
  currency?: string;
}, request: NextRequest) {
  try {
    const { userId, transactionAmount, currency } = body;

    const assessment = await FraudDetection.assessFraudRisk(
      request,
      userId,
      transactionAmount,
      currency
    );

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: assessment.id,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        action: assessment.action,
        signals: assessment.signals,
        timestamp: assessment.timestamp,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fraud assessment failed',
    }, { status: 500 });
  }
}

async function blockEntity(body: {
  type: 'user' | 'ip';
  identifier: string;
  reason: string;
  duration?: number;
}) {
  const { type, identifier, reason, duration = 24 * 3600 } = body;

  if (!type || !identifier || !reason) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    if (type === 'user') {
      await FraudDetection.blockUser(identifier, reason, duration);
    } else if (type === 'ip') {
      await FraudDetection.blockIP(identifier, reason, duration);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid block type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        identifier,
        reason,
        duration,
        blockedAt: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to block entity',
    }, { status: 500 });
  }
}

async function getFraudStatistics() {
  try {
    const stats = await FraudDetection.getFraudStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get fraud statistics',
    }, { status: 500 });
  }
}

async function getSecurityEvents(userId?: string) {
  try {
    // In real implementation, this would query stored events
    // For now, return mock data
    const events = [
      {
        id: 'security_123',
        type: 'login_attempt',
        userId: userId || 'user123',
        success: true,
        riskScore: 15,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
      },
      {
        id: 'security_124',
        type: 'payment_attempt',
        userId: userId || 'user123',
        success: false,
        riskScore: 75,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
        metadata: { transactionAmount: 999.99 },
      },
    ];

    const filteredEvents = userId 
      ? events.filter(event => event.userId === userId)
      : events;

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        total: filteredEvents.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get security events',
    }, { status: 500 });
  }
}