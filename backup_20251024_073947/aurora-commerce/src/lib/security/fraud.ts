import { NextRequest } from 'next/server';
import { cache } from '../cache/redis';
import { PerformanceMonitor } from '../performance/optimization';

// Risk Score Thresholds
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Fraud Detection Rules
export enum FraudRule {
  VELOCITY_CHECK = 'velocity_check',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  GEOLOCATION_ANOMALY = 'geolocation_anomaly',
  BEHAVIORAL_ANALYSIS = 'behavioral_analysis',
  PAYMENT_VERIFICATION = 'payment_verification',
  EMAIL_REPUTATION = 'email_reputation',
  IP_REPUTATION = 'ip_reputation',
  CARD_VERIFICATION = 'card_verification',
}

interface FraudSignal {
  rule: FraudRule;
  score: number; // 0-100
  reason: string;
  metadata?: Record<string, any>;
}

interface FraudAssessment {
  id: string;
  userId?: string;
  sessionId: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  signals: FraudSignal[];
  action: 'allow' | 'challenge' | 'block';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  transactionAmount?: number;
  currency?: string;
}

interface UserBehaviorProfile {
  userId: string;
  averageTransactionAmount: number;
  frequentLocations: string[];
  typicalDevices: string[];
  averageSessionDuration: number;
  commonPurchaseHours: number[];
  riskHistory: Array<{ date: Date; score: number }>;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'payment_attempt' | 'account_access' | 'data_breach' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata: Record<string, any>;
  riskScore?: number;
  timestamp: Date;
}

export class FraudDetection {
  private static readonly FRAUD_CACHE_PREFIX = 'fraud:';
  private static readonly BEHAVIOR_CACHE_PREFIX = 'behavior:';
  private static readonly SECURITY_EVENT_PREFIX = 'security:event:';
  private static readonly BLOCKLIST_PREFIX = 'blocklist:';

  // Risk Thresholds
  private static readonly RISK_THRESHOLDS = {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90,
  };

  // Main fraud detection entry point
  static async assessFraudRisk(
    request: NextRequest,
    userId?: string,
    transactionAmount?: number,
    currency = 'USD'
  ): Promise<FraudAssessment> {
    const sessionId = this.getSessionId(request);
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      const signals: FraudSignal[] = [];

      // Run all fraud detection rules
      const ruleResults = await Promise.allSettled([
        this.checkVelocity(userId, ipAddress, transactionAmount),
        this.checkDeviceFingerprint(userId, userAgent),
        this.checkGeolocationAnomaly(userId, ipAddress),
        this.checkBehavioralPattern(userId, transactionAmount),
        this.checkPaymentVerification(transactionAmount, currency),
        this.checkEmailReputation(userId),
        this.checkIPReputation(ipAddress),
        this.checkCardVerification(userId, transactionAmount),
      ]);

      // Collect signals from successful checks
      ruleResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          signals.push(result.value);
        }
      });

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(signals);
      const riskLevel = this.determineRiskLevel(riskScore);
      const action = this.determineAction(riskLevel, riskScore);

      const assessment: FraudAssessment = {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        riskScore,
        riskLevel,
        signals,
        action,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        transactionAmount,
        currency,
      };

      // Store assessment
      await cache.set(
        `${this.FRAUD_CACHE_PREFIX}assessment:${assessment.id}`,
        assessment,
        3600 // 1 hour TTL
      );

      // Update user behavior profile if user is authenticated
      if (userId) {
        await this.updateBehaviorProfile(userId, assessment);
      }

      // Log security event
      await this.logSecurityEvent({
        type: transactionAmount ? 'payment_attempt' : 'account_access',
        userId,
        ipAddress,
        userAgent,
        success: action === 'allow',
        metadata: {
          riskScore,
          riskLevel,
          transactionAmount,
          currency,
        },
        riskScore,
      });

      // Record metrics
      await PerformanceMonitor.recordMetric('fraud_assessment', 1, {
        riskLevel,
        action,
        signalCount: signals.length.toString(),
      });

      console.log(
        `🛡️ Fraud Assessment: User ${userId || 'anonymous'} - Risk: ${riskLevel} (${riskScore}) - Action: ${action}`
      );

      return assessment;
    } catch (error) {
      console.error('Fraud assessment failed:', error);
      
      // Return safe default assessment
      return {
        id: `fraud_error_${Date.now()}`,
        userId,
        sessionId,
        riskScore: 50,
        riskLevel: RiskLevel.MEDIUM,
        signals: [],
        action: 'challenge',
        timestamp: new Date(),
        ipAddress,
        userAgent,
        transactionAmount,
        currency,
      };
    }
  }

  // Individual fraud detection rules
  private static async checkVelocity(
    userId?: string,
    ipAddress?: string,
    transactionAmount?: number
  ): Promise<FraudSignal | null> {
    try {
      const now = Date.now();
      const hourAgo = now - (60 * 60 * 1000);
      let score = 0;
      let reason = '';

      // Check user velocity
      if (userId) {
        const userKey = `velocity:user:${userId}`;
        const userActions = await cache.get(userKey) as number[] || [];
        const recentActions = userActions.filter(timestamp => timestamp > hourAgo);
        
        if (recentActions.length > 10) {
          score += 30;
          reason += 'High user velocity; ';
        }
        
        // Update user velocity
        userActions.push(now);
        await cache.set(userKey, userActions.slice(-50), 3600); // Keep last 50 actions
      }

      // Check IP velocity
      if (ipAddress) {
        const ipKey = `velocity:ip:${ipAddress}`;
        const ipActions = await cache.get(ipKey) as number[] || [];
        const recentIpActions = ipActions.filter(timestamp => timestamp > hourAgo);
        
        if (recentIpActions.length > 50) {
          score += 40;
          reason += 'High IP velocity; ';
        }
        
        // Update IP velocity
        ipActions.push(now);
        await cache.set(ipKey, ipActions.slice(-100), 3600);
      }

      // Check transaction amount velocity
      if (transactionAmount && userId) {
        const amountKey = `velocity:amount:${userId}`;
        const recentAmounts = await cache.get(amountKey) as number[] || [];
        const totalRecentAmount = recentAmounts.reduce((sum, amount) => sum + amount, 0);
        
        if (totalRecentAmount > 10000) { // $10,000 in the last hour
          score += 25;
          reason += 'High transaction amount velocity; ';
        }
        
        recentAmounts.push(transactionAmount);
        await cache.set(amountKey, recentAmounts.slice(-20), 3600);
      }

      if (score > 0) {
        return {
          rule: FraudRule.VELOCITY_CHECK,
          score,
          reason: reason.trim(),
          metadata: { userId, ipAddress, transactionAmount },
        };
      }

      return null;
    } catch (error) {
      console.error('Velocity check failed:', error);
      return null;
    }
  }

  private static async checkDeviceFingerprint(
    userId?: string,
    userAgent?: string
  ): Promise<FraudSignal | null> {
    if (!userId || !userAgent) return null;

    try {
      const deviceKey = `device:${userId}`;
      const knownDevices = await cache.get(deviceKey) as string[] || [];
      
      // Simple device fingerprinting based on User-Agent
      const deviceFingerprint = Buffer.from(userAgent).toString('base64').substring(0, 16);
      
      if (knownDevices.length > 0 && !knownDevices.includes(deviceFingerprint)) {
        // Store new device
        knownDevices.push(deviceFingerprint);
        await cache.set(deviceKey, knownDevices.slice(-5), 7 * 24 * 3600); // Keep 5 devices for 7 days
        
        return {
          rule: FraudRule.DEVICE_FINGERPRINT,
          score: 20,
          reason: 'New device detected',
          metadata: { deviceFingerprint, knownDeviceCount: knownDevices.length - 1 },
        };
      }

      // Add device if first time
      if (knownDevices.length === 0) {
        await cache.set(deviceKey, [deviceFingerprint], 7 * 24 * 3600);
      }

      return null;
    } catch (error) {
      console.error('Device fingerprint check failed:', error);
      return null;
    }
  }

  private static async checkGeolocationAnomaly(
    userId?: string,
    ipAddress?: string
  ): Promise<FraudSignal | null> {
    if (!userId || !ipAddress) return null;

    try {
      // Simulate geolocation lookup (in real implementation, use GeoIP service)
      const currentLocation = this.getLocationFromIP(ipAddress);
      
      const locationKey = `location:${userId}`;
      const knownLocations = await cache.get(locationKey) as string[] || [];
      
      if (knownLocations.length > 0 && !knownLocations.includes(currentLocation.country)) {
        // Check if it's a significant distance (simplified)
        const isAnomalous = !knownLocations.some(location => 
          this.isSameRegion(location, currentLocation.country)
        );
        
        if (isAnomalous) {
          knownLocations.push(currentLocation.country);
          await cache.set(locationKey, knownLocations.slice(-10), 30 * 24 * 3600); // 30 days
          
          return {
            rule: FraudRule.GEOLOCATION_ANOMALY,
            score: 35,
            reason: `Access from new country: ${currentLocation.country}`,
            metadata: { 
              currentLocation: currentLocation.country,
              knownLocations: knownLocations.slice(-5)
            },
          };
        }
      }

      // Add location if first time
      if (knownLocations.length === 0) {
        await cache.set(locationKey, [currentLocation.country], 30 * 24 * 3600);
      }

      return null;
    } catch (error) {
      console.error('Geolocation check failed:', error);
      return null;
    }
  }

  private static async checkBehavioralPattern(
    userId?: string,
    transactionAmount?: number
  ): Promise<FraudSignal | null> {
    if (!userId) return null;

    try {
      const profile = await this.getBehaviorProfile(userId);
      if (!profile) return null;

      let score = 0;
      let reason = '';

      // Check transaction amount deviation
      if (transactionAmount) {
        const deviation = Math.abs(transactionAmount - profile.averageTransactionAmount) / profile.averageTransactionAmount;
        
        if (deviation > 5) { // 500% deviation
          score += 40;
          reason += `Unusual transaction amount (${deviation.toFixed(1)}x deviation); `;
        } else if (deviation > 2) { // 200% deviation
          score += 20;
          reason += `Higher than usual transaction amount; `;
        }
      }

      // Check time-based patterns
      const currentHour = new Date().getHours();
      if (!profile.commonPurchaseHours.includes(currentHour)) {
        score += 15;
        reason += 'Unusual purchase time; ';
      }

      if (score > 0) {
        return {
          rule: FraudRule.BEHAVIORAL_ANALYSIS,
          score,
          reason: reason.trim(),
          metadata: { 
            transactionAmount,
            averageAmount: profile.averageTransactionAmount,
            currentHour,
            commonHours: profile.commonPurchaseHours 
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Behavioral analysis failed:', error);
      return null;
    }
  }

  private static async checkPaymentVerification(
    transactionAmount?: number,
    currency = 'USD'
  ): Promise<FraudSignal | null> {
    if (!transactionAmount) return null;

    try {
      let score = 0;
      let reason = '';

      // Check for suspicious amounts
      if (transactionAmount > 10000) {
        score += 30;
        reason += 'High transaction amount; ';
      }

      // Check for round numbers (potential testing)
      if (transactionAmount % 100 === 0 && transactionAmount >= 1000) {
        score += 10;
        reason += 'Round number transaction; ';
      }

      // Check for common fraud amounts
      const suspiciousAmounts = [1, 5, 10, 99, 199, 299, 999];
      if (suspiciousAmounts.includes(transactionAmount)) {
        score += 25;
        reason += 'Common fraud testing amount; ';
      }

      if (score > 0) {
        return {
          rule: FraudRule.PAYMENT_VERIFICATION,
          score,
          reason: reason.trim(),
          metadata: { transactionAmount, currency },
        };
      }

      return null;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return null;
    }
  }

  private static async checkEmailReputation(userId?: string): Promise<FraudSignal | null> {
    if (!userId) return null;

    try {
      // Simulate email reputation check
      const emailKey = `email:reputation:${userId}`;
      const reputation = await cache.get(emailKey) as number || 50; // Default neutral score
      
      if (reputation < 30) {
        return {
          rule: FraudRule.EMAIL_REPUTATION,
          score: 35,
          reason: 'Poor email reputation',
          metadata: { reputation },
        };
      }

      return null;
    } catch (error) {
      console.error('Email reputation check failed:', error);
      return null;
    }
  }

  private static async checkIPReputation(ipAddress: string): Promise<FraudSignal | null> {
    try {
      // Check if IP is on blocklist
      const blockedIP = await cache.exists(`${this.BLOCKLIST_PREFIX}ip:${ipAddress}`);
      if (blockedIP) {
        return {
          rule: FraudRule.IP_REPUTATION,
          score: 80,
          reason: 'IP address is blocklisted',
          metadata: { ipAddress },
        };
      }

      // Simulate IP reputation service
      const reputationKey = `ip:reputation:${ipAddress}`;
      const reputation = await cache.get(reputationKey) as number || 50;
      
      if (reputation < 25) {
        return {
          rule: FraudRule.IP_REPUTATION,
          score: 40,
          reason: 'Poor IP reputation',
          metadata: { ipAddress, reputation },
        };
      }

      return null;
    } catch (error) {
      console.error('IP reputation check failed:', error);
      return null;
    }
  }

  private static async checkCardVerification(
    userId?: string,
    transactionAmount?: number
  ): Promise<FraudSignal | null> {
    if (!userId || !transactionAmount) return null;

    try {
      // Simulate card verification checks
      const cardKey = `card:verification:${userId}`;
      const cardData = await cache.get(cardKey) as any;
      
      if (cardData) {
        let score = 0;
        let reason = '';

        // Check for multiple failed verifications
        if (cardData.failedVerifications > 3) {
          score += 30;
          reason += 'Multiple failed card verifications; ';
        }

        // Check for suspicious card patterns
        if (cardData.isTestCard) {
          score += 50;
          reason += 'Test card detected; ';
        }

        if (score > 0) {
          return {
            rule: FraudRule.CARD_VERIFICATION,
            score,
            reason: reason.trim(),
            metadata: { failedVerifications: cardData.failedVerifications },
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Card verification check failed:', error);
      return null;
    }
  }

  // Risk calculation and decision logic
  private static calculateRiskScore(signals: FraudSignal[]): number {
    if (signals.length === 0) return 0;

    // Weighted average with diminishing returns
    const totalScore = signals.reduce((sum, signal) => sum + signal.score, 0);
    const averageScore = totalScore / signals.length;
    
    // Apply diminishing returns for multiple signals
    const signalMultiplier = Math.min(1 + (signals.length - 1) * 0.1, 1.5);
    
    return Math.min(Math.round(averageScore * signalMultiplier), 100);
  }

  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= this.RISK_THRESHOLDS.CRITICAL) return RiskLevel.CRITICAL;
    if (score >= this.RISK_THRESHOLDS.HIGH) return RiskLevel.HIGH;
    if (score >= this.RISK_THRESHOLDS.MEDIUM) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private static determineAction(riskLevel: RiskLevel, score: number): 'allow' | 'challenge' | 'block' {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return 'block';
      case RiskLevel.HIGH:
        return score > 80 ? 'block' : 'challenge';
      case RiskLevel.MEDIUM:
        return 'challenge';
      default:
        return 'allow';
    }
  }

  // Behavior profile management
  private static async getBehaviorProfile(userId: string): Promise<UserBehaviorProfile | null> {
    try {
      const profile = await cache.get(`${this.BEHAVIOR_CACHE_PREFIX}profile:${userId}`);
      return profile as UserBehaviorProfile | null;
    } catch (error) {
      console.error('Failed to get behavior profile:', error);
      return null;
    }
  }

  private static async updateBehaviorProfile(
    userId: string,
    assessment: FraudAssessment
  ): Promise<void> {
    try {
      const profileKey = `${this.BEHAVIOR_CACHE_PREFIX}profile:${userId}`;
      let profile = await this.getBehaviorProfile(userId);

      if (!profile) {
        profile = {
          userId,
          averageTransactionAmount: assessment.transactionAmount || 0,
          frequentLocations: [],
          typicalDevices: [],
          averageSessionDuration: 0,
          commonPurchaseHours: [new Date().getHours()],
          riskHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Update profile with new data
      if (assessment.transactionAmount) {
        profile.averageTransactionAmount = 
          (profile.averageTransactionAmount + assessment.transactionAmount) / 2;
      }

      profile.riskHistory.push({
        date: assessment.timestamp,
        score: assessment.riskScore,
      });

      // Keep only last 30 risk scores
      profile.riskHistory = profile.riskHistory.slice(-30);

      const currentHour = new Date().getHours();
      if (!profile.commonPurchaseHours.includes(currentHour)) {
        profile.commonPurchaseHours.push(currentHour);
        profile.commonPurchaseHours = profile.commonPurchaseHours.slice(-10); // Keep top 10 hours
      }

      profile.updatedAt = new Date();

      await cache.set(profileKey, profile, 30 * 24 * 3600); // 30 days TTL
    } catch (error) {
      console.error('Failed to update behavior profile:', error);
    }
  }

  // Security event logging
  private static async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      await cache.set(
        `${this.SECURITY_EVENT_PREFIX}${securityEvent.id}`,
        securityEvent,
        7 * 24 * 3600 // 7 days TTL
      );

      console.log(`🔐 Security Event: ${event.type} - ${event.success ? 'Success' : 'Failed'} - Risk: ${event.riskScore}`);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Utility methods
  private static getSessionId(request: NextRequest): string {
    // In real implementation, extract from cookie or header
    return request.headers.get('x-session-id') || `session_${Date.now()}`;
  }

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

  private static getLocationFromIP(ipAddress: string): { country: string; region: string } {
    // Simulate GeoIP lookup
    const locations = [
      { country: 'US', region: 'North America' },
      { country: 'GB', region: 'Europe' },
      { country: 'CA', region: 'North America' },
      { country: 'DE', region: 'Europe' },
      { country: 'FR', region: 'Europe' },
      { country: 'JP', region: 'Asia' },
      { country: 'AU', region: 'Oceania' },
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static isSameRegion(country1: string, country2: string): boolean {
    const regions: Record<string, string> = {
      'US': 'North America',
      'CA': 'North America',
      'MX': 'North America',
      'GB': 'Europe',
      'DE': 'Europe',
      'FR': 'Europe',
      'IT': 'Europe',
      'ES': 'Europe',
      'JP': 'Asia',
      'CN': 'Asia',
      'KR': 'Asia',
      'AU': 'Oceania',
      'NZ': 'Oceania',
    };
    
    return regions[country1] === regions[country2];
  }

  // Administrative functions
  static async blockIP(ipAddress: string, reason: string, duration = 24 * 3600): Promise<void> {
    try {
      await cache.set(
        `${this.BLOCKLIST_PREFIX}ip:${ipAddress}`,
        { reason, blockedAt: new Date() },
        duration
      );
      
      console.log(`🚫 IP Blocked: ${ipAddress} - ${reason}`);
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }

  static async blockUser(userId: string, reason: string, duration = 24 * 3600): Promise<void> {
    try {
      await cache.set(
        `${this.BLOCKLIST_PREFIX}user:${userId}`,
        { reason, blockedAt: new Date() },
        duration
      );
      
      console.log(`🚫 User Blocked: ${userId} - ${reason}`);
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  }

  static async isBlocked(userId?: string, ipAddress?: string): Promise<boolean> {
    try {
      if (userId) {
        const userBlocked = await cache.exists(`${this.BLOCKLIST_PREFIX}user:${userId}`);
        if (userBlocked) return true;
      }
      
      if (ipAddress) {
        const ipBlocked = await cache.exists(`${this.BLOCKLIST_PREFIX}ip:${ipAddress}`);
        if (ipBlocked) return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check block status:', error);
      return false;
    }
  }

  static async getFraudStatistics(): Promise<{
    totalAssessments: number;
    riskDistribution: Record<RiskLevel, number>;
    actionDistribution: Record<string, number>;
    topFraudRules: Array<{ rule: FraudRule; count: number }>;
  }> {
    try {
      // In real implementation, this would query stored assessments
      // For now, return simulated statistics
      return {
        totalAssessments: 1250,
        riskDistribution: {
          [RiskLevel.LOW]: 65,
          [RiskLevel.MEDIUM]: 20,
          [RiskLevel.HIGH]: 12,
          [RiskLevel.CRITICAL]: 3,
        },
        actionDistribution: {
          allow: 75,
          challenge: 20,
          block: 5,
        },
        topFraudRules: [
          { rule: FraudRule.VELOCITY_CHECK, count: 45 },
          { rule: FraudRule.GEOLOCATION_ANOMALY, count: 32 },
          { rule: FraudRule.DEVICE_FINGERPRINT, count: 28 },
          { rule: FraudRule.BEHAVIORAL_ANALYSIS, count: 25 },
          { rule: FraudRule.IP_REPUTATION, count: 18 },
        ],
      };
    } catch (error) {
      console.error('Failed to get fraud statistics:', error);
      return {
        totalAssessments: 0,
        riskDistribution: {
          [RiskLevel.LOW]: 0,
          [RiskLevel.MEDIUM]: 0,
          [RiskLevel.HIGH]: 0,
          [RiskLevel.CRITICAL]: 0,
        },
        actionDistribution: { allow: 0, challenge: 0, block: 0 },
        topFraudRules: [],
      };
    }
  }
}