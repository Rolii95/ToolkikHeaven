import { NextRequest, NextResponse } from 'next/server';
import { FraudDetection } from './fraud';

// Security middleware for API routes
export function withSecurity(options: {
  requireAuth?: boolean;
  checkFraud?: boolean;
  rateLimit?: number; // requests per minute
} = {}) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function securedHandler(req: NextRequest): Promise<NextResponse> {
      const {
        requireAuth = false,
        checkFraud = true,
        rateLimit = 60,
      } = options;

      try {
        // Rate limiting
        if (rateLimit > 0) {
          const rateLimitResult = await checkRateLimit(req, rateLimit);
          if (!rateLimitResult.allowed) {
            return NextResponse.json(
              { 
                error: 'Rate limit exceeded',
                retryAfter: rateLimitResult.retryAfter 
              },
              { 
                status: 429,
                headers: {
                  'Retry-After': rateLimitResult.retryAfter.toString(),
                  'X-RateLimit-Limit': rateLimit.toString(),
                  'X-RateLimit-Remaining': '0',
                },
              }
            );
          }
        }

        // Authentication check
        if (requireAuth) {
          const authResult = await checkAuthentication(req);
          if (!authResult.authenticated) {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            );
          }
        }

        // Fraud detection
        if (checkFraud) {
          const userId = getUserIdFromRequest(req);
          const fraudResult = await FraudDetection.assessFraudRisk(req, userId);
          
          if (fraudResult.action === 'block') {
            return NextResponse.json(
              { 
                error: 'Request blocked for security reasons',
                riskScore: fraudResult.riskScore 
              },
              { status: 403 }
            );
          }
          
          if (fraudResult.action === 'challenge') {
            return NextResponse.json(
              { 
                error: 'Additional verification required',
                challengeRequired: true,
                riskScore: fraudResult.riskScore 
              },
              { status: 423 } // Locked status
            );
          }
        }

        // Block check
        const userId = getUserIdFromRequest(req);
        const ipAddress = getClientIP(req);
        const isBlocked = await FraudDetection.isBlocked(userId, ipAddress);
        
        if (isBlocked) {
          return NextResponse.json(
            { error: 'Access denied - account or IP blocked' },
            { status: 403 }
          );
        }

        // Add security headers to response
        const response = await handler(req);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Security middleware error:', error);
        return NextResponse.json(
          { error: 'Security check failed' },
          { status: 500 }
        );
      }
    };
  };
}

// Rate limiting implementation
async function checkRateLimit(
  req: NextRequest,
  limitPerMinute: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    const identifier = getClientIP(req) + ':' + req.nextUrl.pathname;
    const key = `ratelimit:${identifier}`;
    
    // Get current count (simplified - in production use sliding window)
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - 60; // 1 minute window
    
    // For this demo, we'll use a simple counter
    // In production, use a sliding window or token bucket algorithm
    const currentCount = await getRateLimitCount(key);
    
    if (currentCount >= limitPerMinute) {
      return { allowed: false, retryAfter: 60 };
    }
    
    await incrementRateLimitCount(key);
    return { allowed: true, retryAfter: 0 };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, retryAfter: 0 }; // Fail open
  }
}

async function getRateLimitCount(key: string): Promise<number> {
  // In real implementation, this would use Redis or similar
  // For demo, we'll simulate with a simple in-memory store
  return Math.floor(Math.random() * 50); // Simulate current count
}

async function incrementRateLimitCount(key: string): Promise<void> {
  // In real implementation, increment Redis counter with TTL
  console.log(`Rate limit incremented for ${key}`);
}

// Authentication check
async function checkAuthentication(req: NextRequest): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('session')?.value;
    
    if (!authHeader && !sessionCookie) {
      return { authenticated: false };
    }
    
    // Simplified auth check - in production, verify JWT or session
    if (authHeader?.startsWith('Bearer ') || sessionCookie) {
      return { 
        authenticated: true, 
        userId: 'user_123' // Extract from token/session
      };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false };
  }
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.set('X-Powered-By', ''); // Remove framework info
  
  return response;
}

// Utility functions
function getUserIdFromRequest(req: NextRequest): string | undefined {
  // Extract from JWT, session, or auth header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In real implementation, decode JWT to get user ID
    return 'user_123';
  }
  return undefined;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return 'unknown';
}

// Input validation and sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>&"']/g, (match) => {
        const map: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return map[match];
      })
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// CORS configuration
export function withCORS(
  response: NextResponse,
  options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  } = {}
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = false,
  } = options;

  if (Array.isArray(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin.join(', '));
  } else {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  
  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

// SQL injection prevention
export function sanitizeSQL(query: string): string {
  // Remove SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(\b(UNION|OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(;|\|\||&&)/g,
    /\/\*.*?\*\//g,
    /--.*$/gm,
  ];
  
  let sanitized = query;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

// XSS prevention
export function escapeHTML(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (match) => map[match]);
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateCSRFToken(req: NextRequest, expectedToken?: string): boolean {
  const tokenFromHeader = req.headers.get('x-csrf-token');
  const tokenFromCookie = req.cookies.get('csrf-token')?.value;
  
  if (!expectedToken) {
    expectedToken = tokenFromCookie;
  }
  
  return !!(tokenFromHeader && expectedToken && tokenFromHeader === expectedToken);
}

// Password security utilities
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Character variety
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain lowercase letters');
  } else {
    score += 15;
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain uppercase letters');
  } else {
    score += 15;
  }
  
  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain numbers');
  } else {
    score += 15;
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Password must contain special characters');
  } else {
    score += 20;
  }
  
  // Common patterns
  const commonPatterns = [
    /123/,
    /abc/i,
    /password/i,
    /qwerty/i,
    /(.)\1{2,}/, // Repeated characters
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    issues.push('Password contains common patterns');
    score -= 25;
  } else {
    score += 15;
  }
  
  return {
    isValid: issues.length === 0 && score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
  };
}