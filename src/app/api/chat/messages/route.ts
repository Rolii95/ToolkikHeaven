import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  id: string;
  sessionId: string;
  text: string;
  isFromUser: boolean;
  timestamp: string;
  messageType?: 'text' | 'system' | 'file';
  metadata?: any;
}

interface ChatSession {
  id: string;
  customerEmail?: string;
  customerName?: string;
  agentId?: string;
  agentName?: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  messages: ChatMessage[];
}

// In-memory storage for demo purposes
// In production, use a database like PostgreSQL, MongoDB, or Redis
let activeSessions: Map<string, ChatSession> = new Map();
let allMessages: ChatMessage[] = [];

// Auto-response templates
const AUTO_RESPONSES = [
  "Thank you for your message! An agent will be with you shortly.",
  "I understand your concern. Let me connect you with a specialist who can help.",
  "Thanks for reaching out! We're here to help you with any questions.",
  "I appreciate your patience. Let me get the right person to assist you.",
];

// Generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Simulate agent response
const getAutoResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Simple keyword-based responses
  if (lowerMessage.includes('order') || lowerMessage.includes('purchase')) {
    return "I can help you with your order! Can you please provide your order number or email address?";
  }
  
  if (lowerMessage.includes('refund') || lowerMessage.includes('return')) {
    return "I understand you'd like to process a return or refund. Let me connect you with our returns specialist.";
  }
  
  if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
    return "I can help with shipping questions! What specific information do you need about your delivery?";
  }
  
  if (lowerMessage.includes('account') || lowerMessage.includes('login')) {
    return "I can assist with account-related issues. Are you having trouble logging in or accessing your account?";
  }
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
    return "I can help with payment and billing questions. What specific issue are you experiencing?";
  }
  
  // Default responses
  return AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, customerData } = body;

    switch (action) {
      case 'start_session':
        return handleStartSession(customerData);
      
      case 'send_message':
        return handleSendMessage(sessionId, message);
      
      case 'end_session':
        return handleEndSession(sessionId);
      
      case 'get_messages':
        return handleGetMessages(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleStartSession(customerData: any) {
  const sessionId = generateId();
  const session: ChatSession = {
    id: sessionId,
    customerEmail: customerData?.email,
    customerName: customerData?.name,
    startTime: new Date().toISOString(),
    isActive: true,
    messages: [],
  };

  activeSessions.set(sessionId, session);

  // Add welcome message
  const welcomeMessage: ChatMessage = {
    id: generateId(),
    sessionId,
    text: `Welcome${customerData?.name ? `, ${customerData.name}` : ''}! You're now connected with our support team. How can we help you today?`,
    isFromUser: false,
    timestamp: new Date().toISOString(),
    messageType: 'system',
  };

  session.messages.push(welcomeMessage);
  allMessages.push(welcomeMessage);

  return NextResponse.json({
    success: true,
    sessionId,
    message: 'Chat session started successfully',
    welcomeMessage,
  });
}

async function handleSendMessage(sessionId: string, messageText: string) {
  if (!sessionId || !messageText?.trim()) {
    return NextResponse.json(
      { error: 'Session ID and message are required' },
      { status: 400 }
    );
  }

  const session = activeSessions.get(sessionId);
  if (!session || !session.isActive) {
    return NextResponse.json(
      { error: 'Invalid or inactive session' },
      { status: 404 }
    );
  }

  // Add user message
  const userMessage: ChatMessage = {
    id: generateId(),
    sessionId,
    text: messageText.trim(),
    isFromUser: true,
    timestamp: new Date().toISOString(),
    messageType: 'text',
  };

  session.messages.push(userMessage);
  allMessages.push(userMessage);

  // Simulate agent response after a delay
  setTimeout(async () => {
    const agentResponse: ChatMessage = {
      id: generateId(),
      sessionId,
      text: getAutoResponse(messageText),
      isFromUser: false,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };

    session.messages.push(agentResponse);
    allMessages.push(agentResponse);

    // In a real implementation, you would broadcast this to the client
    // via WebSocket or Server-Sent Events
  }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

  return NextResponse.json({
    success: true,
    message: userMessage,
    status: 'Agent is typing...',
  });
}

async function handleEndSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  session.isActive = false;
  session.endTime = new Date().toISOString();

  // Add goodbye message
  const goodbyeMessage: ChatMessage = {
    id: generateId(),
    sessionId,
    text: "Thank you for contacting us! This chat session has ended. Feel free to start a new chat if you need further assistance.",
    isFromUser: false,
    timestamp: new Date().toISOString(),
    messageType: 'system',
  };

  session.messages.push(goodbyeMessage);
  allMessages.push(goodbyeMessage);

  return NextResponse.json({
    success: true,
    message: 'Session ended successfully',
    sessionSummary: {
      id: sessionId,
      duration: session.endTime ? 
        Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000) : 0,
      messageCount: session.messages.length,
    },
    goodbyeMessage,
  });
}

async function handleGetMessages(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    sessionId,
    messages: session.messages,
    isActive: session.isActive,
  });
}

// GET endpoint for health check and session info
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (sessionId) {
    return handleGetMessages(sessionId);
  }

  return NextResponse.json({
    status: 'Chat service is online',
    activeSessions: activeSessions.size,
    totalMessages: allMessages.length,
    endpoints: {
      '/api/chat/messages': 'Send messages and manage chat sessions',
      '/api/chat/business-hours': 'Check business hours status',
      '/api/chat/contact': 'Submit contact forms for offline support',
    },
  });
}

// Clean up old sessions periodically (in production, use a proper job queue)
setInterval(() => {
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  activeSessions.forEach((session, sessionId) => {
    const sessionTime = new Date(session.endTime || session.startTime);
    if (sessionTime < fourHoursAgo) {
      activeSessions.delete(sessionId);
    }
  });
}, 60 * 60 * 1000); // Run every hour