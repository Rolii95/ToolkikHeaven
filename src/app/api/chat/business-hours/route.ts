import { NextRequest, NextResponse } from 'next/server';

interface BusinessHours {
  timezone: string;
  monday: { open: string; close: string; enabled: boolean };
  tuesday: { open: string; close: string; enabled: boolean };
  wednesday: { open: string; close: string; enabled: boolean };
  thursday: { open: string; close: string; enabled: boolean };
  friday: { open: string; close: string; enabled: boolean };
  saturday: { open: string; close: string; enabled: boolean };
  sunday: { open: string; close: string; enabled: boolean };
}

// Business hours configuration (could be stored in database/env vars)
const BUSINESS_HOURS: BusinessHours = {
  timezone: process.env.BUSINESS_TIMEZONE || 'America/New_York',
  monday: { open: process.env.MONDAY_OPEN || '09:00', close: process.env.MONDAY_CLOSE || '17:00', enabled: true },
  tuesday: { open: process.env.TUESDAY_OPEN || '09:00', close: process.env.TUESDAY_CLOSE || '17:00', enabled: true },
  wednesday: { open: process.env.WEDNESDAY_OPEN || '09:00', close: process.env.WEDNESDAY_CLOSE || '17:00', enabled: true },
  thursday: { open: process.env.THURSDAY_OPEN || '09:00', close: process.env.THURSDAY_CLOSE || '17:00', enabled: true },
  friday: { open: process.env.FRIDAY_OPEN || '09:00', close: process.env.FRIDAY_CLOSE || '17:00', enabled: true },
  saturday: { open: process.env.SATURDAY_OPEN || '10:00', close: process.env.SATURDAY_CLOSE || '15:00', enabled: true },
  sunday: { open: process.env.SUNDAY_OPEN || '10:00', close: process.env.SUNDAY_CLOSE || '15:00', enabled: false },
};

function isWithinBusinessHours(businessHours: BusinessHours): boolean {
  try {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()] as keyof BusinessHours;
    
    if (currentDay === 'timezone') return false;
    
    const dayConfig = businessHours[currentDay];
    if (!dayConfig || !dayConfig.enabled) return false;
    
    // Convert current time to business timezone
    const timeInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: businessHours.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentTime = timeInTz.replace(':', '');
    const openTime = dayConfig.open.replace(':', '');
    const closeTime = dayConfig.close.replace(':', '');
    
    return currentTime >= openTime && currentTime <= closeTime;
  } catch (error) {
    console.error('Error checking business hours:', error);
    return false; // Default to closed if there's an error
  }
}

function getNextOpenTime(businessHours: BusinessHours): string {
  try {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check today first
    const currentDay = dayNames[now.getDay()] as keyof BusinessHours;
    if (currentDay !== 'timezone') {
      const todayConfig = businessHours[currentDay];
      if (todayConfig && todayConfig.enabled) {
        const timeInTz = new Intl.DateTimeFormat('en-US', {
          timeZone: businessHours.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now);
        
        const currentTime = timeInTz.replace(':', '');
        const openTime = todayConfig.open.replace(':', '');
        
        if (currentTime < openTime) {
          return `Today at ${todayConfig.open}`;
        }
      }
    }
    
    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + i);
      const nextDayName = dayNames[nextDay.getDay()] as keyof BusinessHours;
      
      if (nextDayName !== 'timezone') {
        const dayConfig = businessHours[nextDayName];
        if (dayConfig && dayConfig.enabled) {
          const dayName = nextDayName.charAt(0).toUpperCase() + nextDayName.slice(1);
          return `${dayName} at ${dayConfig.open}`;
        }
      }
    }
    
    return 'Monday at 09:00'; // Fallback
  } catch (error) {
    console.error('Error getting next open time:', error);
    return 'Monday at 09:00'; // Fallback
  }
}

export async function GET(request: NextRequest) {
  try {
    const isOpen = isWithinBusinessHours(BUSINESS_HOURS);
    const nextOpen = !isOpen ? getNextOpenTime(BUSINESS_HOURS) : null;
    
    // Get current time in business timezone
    const now = new Date();
    const currentTimeInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_HOURS.timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(now);

    return NextResponse.json({
      isOpen,
      currentTime: currentTimeInTz,
      timezone: BUSINESS_HOURS.timezone,
      nextOpenTime: nextOpen,
      businessHours: BUSINESS_HOURS,
      message: isOpen 
        ? 'Our support team is currently online and ready to help!'
        : `Our support team is currently offline. We'll be back ${nextOpen}. You can still leave us a message and we'll get back to you within 24 hours.`
    });

  } catch (error) {
    console.error('Business hours check error:', error);
    return NextResponse.json(
      { 
        error: 'Unable to check business hours',
        isOpen: false, // Default to closed on error
        message: 'Our support team may be offline. Please leave a message and we\'ll get back to you soon.'
      }, 
      { status: 500 }
    );
  }
}

// Allow updating business hours (for admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real implementation, you would:
    // 1. Validate admin permissions
    // 2. Update business hours in database
    // 3. Broadcast changes to all connected clients
    
    // For now, just validate the format
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hasAllDays = requiredDays.every(day => body[day] && 
      typeof body[day].open === 'string' && 
      typeof body[day].close === 'string' && 
      typeof body[day].enabled === 'boolean'
    );
    
    if (!hasAllDays || !body.timezone) {
      return NextResponse.json(
        { error: 'Invalid business hours format' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business hours updated successfully',
      businessHours: body
    });

  } catch (error) {
    console.error('Business hours update error:', error);
    return NextResponse.json(
      { error: 'Failed to update business hours' },
      { status: 500 }
    );
  }
}