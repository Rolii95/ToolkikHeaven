import { NextRequest } from 'next/server';
import { cache } from '../cache/redis';
import { PerformanceMonitor } from '../performance/optimization';

// GDPR Data Subject Rights
export enum DataSubjectRights {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
  AUTOMATED_DECISION_MAKING = 'automated_decision_making',
}

// Data Categories for GDPR Classification
export enum DataCategory {
  PERSONAL_IDENTIFIABLE = 'personal_identifiable',
  SENSITIVE_PERSONAL = 'sensitive_personal',
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  TRANSACTIONAL = 'transactional',
  COMMUNICATION = 'communication',
}

// Legal Basis for Data Processing
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}

interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  withdrawnAt?: Date;
}

interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  recipients: string[];
  retentionPeriod: number; // in days
  crossBorderTransfers: boolean;
  safeguards?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DataSubjectRequest {
  id: string;
  userId: string;
  email: string;
  requestType: DataSubjectRights;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  description?: string;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  response?: string;
  attachments?: string[];
}

export class GDPRCompliance {
  private static readonly CONSENT_CACHE_PREFIX = 'gdpr:consent:';
  private static readonly ACTIVITY_CACHE_PREFIX = 'gdpr:activity:';
  private static readonly REQUEST_CACHE_PREFIX = 'gdpr:request:';
  private static readonly AUDIT_LOG_PREFIX = 'gdpr:audit:';

  // Consent Management
  static async recordConsent(
    userId: string,
    purpose: string,
    legalBasis: LegalBasis,
    dataCategories: DataCategory[],
    request: NextRequest,
    expiresInDays?: number
  ): Promise<ConsentRecord> {
    const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const consent: ConsentRecord = {
      id: consentId,
      userId,
      purpose,
      legalBasis,
      dataCategories,
      granted: true,
      timestamp: new Date(),
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      version: '1.0',
    };

    try {
      // Store consent record
      await cache.set(
        `${this.CONSENT_CACHE_PREFIX}${consentId}`,
        consent,
        expiresInDays ? expiresInDays * 24 * 60 * 60 : undefined
      );

      // Index by user ID for quick lookup
      await cache.set(
        `${this.CONSENT_CACHE_PREFIX}user:${userId}:${purpose}`,
        consentId,
        expiresInDays ? expiresInDays * 24 * 60 * 60 : undefined
      );

      // Log the consent action
      await this.auditLog('consent_granted', userId, {
        consentId,
        purpose,
        legalBasis,
        dataCategories,
      });

      console.log(`✅ GDPR: Consent recorded for user ${userId}, purpose: ${purpose}`);
      return consent;
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Consent recording failed');
    }
  }

  static async withdrawConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      const consentId = await cache.get(`${this.CONSENT_CACHE_PREFIX}user:${userId}:${purpose}`);
      
      if (!consentId) {
        return false;
      }

      const consent = await cache.get(`${this.CONSENT_CACHE_PREFIX}${consentId}`);
      if (!consent) {
        return false;
      }

      // Update consent record
      const updatedConsent = {
        ...consent,
        granted: false,
        withdrawnAt: new Date(),
      };

      await cache.set(`${this.CONSENT_CACHE_PREFIX}${consentId}`, updatedConsent);

      // Log the withdrawal
      await this.auditLog('consent_withdrawn', userId, {
        consentId,
        purpose,
        withdrawnAt: new Date(),
      });

      console.log(`🚫 GDPR: Consent withdrawn for user ${userId}, purpose: ${purpose}`);
      return true;
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      return false;
    }
  }

  static async checkConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      const consentId = await cache.get(`${this.CONSENT_CACHE_PREFIX}user:${userId}:${purpose}`);
      
      if (!consentId) {
        return false;
      }

      const consent = await cache.get(`${this.CONSENT_CACHE_PREFIX}${consentId}`) as ConsentRecord;
      
      if (!consent || !consent.granted) {
        return false;
      }

      // Check if consent has expired
      if (consent.expiresAt && new Date() > consent.expiresAt) {
        console.log(`⏰ GDPR: Consent expired for user ${userId}, purpose: ${purpose}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check consent:', error);
      return false;
    }
  }

  // Data Subject Rights Requests
  static async submitDataSubjectRequest(
    userId: string,
    email: string,
    requestType: DataSubjectRights,
    description?: string
  ): Promise<DataSubjectRequest> {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: DataSubjectRequest = {
      id: requestId,
      userId,
      email,
      requestType,
      status: 'pending',
      description,
      requestedAt: new Date(),
    };

    try {
      await cache.set(`${this.REQUEST_CACHE_PREFIX}${requestId}`, request);
      
      // Index by user for quick lookup
      const userRequests = (await cache.get(`${this.REQUEST_CACHE_PREFIX}user:${userId}`) as string[]) || [];
      userRequests.push(requestId);
      await cache.set(`${this.REQUEST_CACHE_PREFIX}user:${userId}`, userRequests);

      // Log the request
      await this.auditLog('data_subject_request', userId, {
        requestId,
        requestType,
        description,
      });

      // Record metric
      await PerformanceMonitor.recordMetric('gdpr_request', 1, {
        type: requestType,
        userId,
      });

      console.log(`📋 GDPR: Data subject request submitted - ${requestType} for user ${userId}`);
      return request;
    } catch (error) {
      console.error('Failed to submit data subject request:', error);
      throw new Error('Request submission failed');
    }
  }

  static async processDataSubjectRequest(
    requestId: string,
    processedBy: string,
    response: string,
    status: 'completed' | 'rejected'
  ): Promise<boolean> {
    try {
      const request = await cache.get(`${this.REQUEST_CACHE_PREFIX}${requestId}`) as DataSubjectRequest;
      
      if (!request) {
        return false;
      }

      const updatedRequest = {
        ...request,
        status,
        processedAt: new Date(),
        processedBy,
        response,
      };

      await cache.set(`${this.REQUEST_CACHE_PREFIX}${requestId}`, updatedRequest);

      // Log the processing
      await this.auditLog('data_subject_request_processed', request.userId, {
        requestId,
        requestType: request.requestType,
        status,
        processedBy,
      });

      console.log(`✅ GDPR: Data subject request processed - ${requestId} (${status})`);
      return true;
    } catch (error) {
      console.error('Failed to process data subject request:', error);
      return false;
    }
  }

  // Data Processing Activities Registry
  static async registerProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullActivity: DataProcessingActivity = {
      ...activity,
      id: activityId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await cache.set(`${this.ACTIVITY_CACHE_PREFIX}${activityId}`, fullActivity);

      // Log the registration
      await this.auditLog('processing_activity_registered', 'system', {
        activityId,
        name: activity.name,
        purpose: activity.purpose,
        legalBasis: activity.legalBasis,
      });

      console.log(`📝 GDPR: Processing activity registered - ${activity.name}`);
      return activityId;
    } catch (error) {
      console.error('Failed to register processing activity:', error);
      throw new Error('Activity registration failed');
    }
  }

  // Data Retention Management
  static async checkDataRetention(): Promise<{
    expiredData: Array<{ type: string; id: string; userId: string; expiredDays: number }>;
    totalChecked: number;
  }> {
    try {
      const activities = await this.getAllProcessingActivities();
      const expiredData = [];
      let totalChecked = 0;

      for (const activity of activities) {
        const cutoffDate = new Date(Date.now() - activity.retentionPeriod * 24 * 60 * 60 * 1000);
        
        // Check for expired user data (simplified check)
        const pattern = `user:*:${activity.name}:*`;
        const keys = await cache.getKeysByPattern(pattern);
        totalChecked += keys.length;

        for (const key of keys) {
          const data: any = await cache.get(key);
          if (data && data.createdAt && new Date(data.createdAt) < cutoffDate) {
            const expiredDays = Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (24 * 60 * 60 * 1000));
            expiredData.push({
              type: activity.name,
              id: key,
              userId: data.userId || 'unknown',
              expiredDays,
            });
          }
        }
      }

      console.log(`🔍 GDPR: Data retention check completed - ${expiredData.length} expired items found`);
      return { expiredData, totalChecked };
    } catch (error) {
      console.error('Data retention check failed:', error);
      return { expiredData: [], totalChecked: 0 };
    }
  }

  static async purgeExpiredData(expiredItems: Array<{ id: string }>): Promise<number> {
    try {
      let purgedCount = 0;

      for (const item of expiredItems) {
        const deleted = await cache.del(item.id);
        if (deleted) {
          purgedCount++;
        }
      }

      // Log the purge
      await this.auditLog('data_retention_purge', 'system', {
        purgedCount,
        totalItems: expiredItems.length,
      });

      console.log(`🗑️ GDPR: Data purge completed - ${purgedCount} items deleted`);
      return purgedCount;
    } catch (error) {
      console.error('Data purge failed:', error);
      return 0;
    }
  }

  // Privacy Impact Assessment
  static async conductPrivacyImpactAssessment(
    activityName: string,
    dataCategories: DataCategory[],
    risks: Array<{ risk: string; likelihood: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high' }>
  ): Promise<{
    score: number;
    recommendation: string;
    requiresDPIA: boolean;
  }> {
    try {
      let score = 0;

      // Score based on data categories
      const highRiskCategories = [DataCategory.SENSITIVE_PERSONAL, DataCategory.BEHAVIORAL];
      score += dataCategories.filter(cat => highRiskCategories.includes(cat)).length * 20;

      // Score based on risks
      for (const risk of risks) {
        const likelihoodScore = risk.likelihood === 'high' ? 3 : risk.likelihood === 'medium' ? 2 : 1;
        const impactScore = risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1;
        score += likelihoodScore * impactScore * 5;
      }

      const requiresDPIA = score >= 50;
      const recommendation = requiresDPIA 
        ? 'High risk processing - Data Protection Impact Assessment required'
        : score >= 30 
        ? 'Medium risk - Consider additional safeguards'
        : 'Low risk - Standard protection measures sufficient';

      // Log the assessment
      await this.auditLog('privacy_impact_assessment', 'system', {
        activityName,
        score,
        requiresDPIA,
        dataCategories,
        risks,
      });

      console.log(`🔒 GDPR: PIA conducted for ${activityName} - Score: ${score} (DPIA required: ${requiresDPIA})`);
      return { score, recommendation, requiresDPIA };
    } catch (error) {
      console.error('Privacy impact assessment failed:', error);
      throw new Error('PIA failed');
    }
  }

  // Breach Detection and Response
  static async reportDataBreach(
    description: string,
    affectedUsers: string[],
    dataCategories: DataCategory[],
    severity: 'low' | 'medium' | 'high',
    reportedBy: string
  ): Promise<string> {
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const breach = {
      id: breachId,
      description,
      affectedUsers,
      dataCategories,
      severity,
      reportedBy,
      reportedAt: new Date(),
      status: 'reported',
      requiresAuthorityNotification: severity === 'high' || affectedUsers.length > 100,
      requiresUserNotification: severity !== 'low',
    };

    try {
      await cache.set(`gdpr:breach:${breachId}`, breach);

      // Log the breach
      await this.auditLog('data_breach_reported', reportedBy, {
        breachId,
        severity,
        affectedUserCount: affectedUsers.length,
        dataCategories,
      });

      console.log(`🚨 GDPR: Data breach reported - ${breachId} (${severity} severity, ${affectedUsers.length} users affected)`);
      return breachId;
    } catch (error) {
      console.error('Failed to report data breach:', error);
      throw new Error('Breach reporting failed');
    }
  }

  // Utility Methods
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    return 'unknown';
  }

  private static async auditLog(action: string, userId: string, data: any): Promise<void> {
    try {
      const logEntry = {
        action,
        userId,
        data,
        timestamp: new Date(),
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      await cache.set(
        `${this.AUDIT_LOG_PREFIX}${logEntry.id}`,
        logEntry,
        7 * 24 * 60 * 60 // 7 days TTL for audit logs
      );
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  private static async getAllProcessingActivities(): Promise<DataProcessingActivity[]> {
    try {
      const keys = await cache.getKeysByPattern(`${this.ACTIVITY_CACHE_PREFIX}*`);
      const activities = await Promise.all(
        keys.map((key: string) => cache.get(key))
      );
      
      return activities.filter((activity: any) => activity !== null) as DataProcessingActivity[];
    } catch (error) {
      console.error('Failed to get processing activities:', error);
      return [];
    }
  }

  // Export user data for portability requests
  static async exportUserData(userId: string): Promise<any> {
    try {
      const userData = {
        userId,
        exportedAt: new Date(),
        data: {
          profile: {},
          orders: [],
          consents: [] as any[],
          preferences: {},
        },
      };

      // Get user consents
      const consentKeys = await cache.getKeysByPattern(`${this.CONSENT_CACHE_PREFIX}user:${userId}:*`);
      for (const key of consentKeys) {
        const consentId = await cache.get(key);
        if (consentId) {
          const consent = await cache.get(`${this.CONSENT_CACHE_PREFIX}${consentId}`);
          if (consent) {
            userData.data.consents.push(consent);
          }
        }
      }

      // Log the export
      await this.auditLog('user_data_exported', userId, {
        exportSize: JSON.stringify(userData).length,
        dataTypes: Object.keys(userData.data),
      });

      console.log(`📤 GDPR: User data exported for ${userId}`);
      return userData;
    } catch (error) {
      console.error('User data export failed:', error);
      throw new Error('Data export failed');
    }
  }
}