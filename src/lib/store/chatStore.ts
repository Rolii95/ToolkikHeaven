'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  isRead?: boolean;
  messageType?: 'text' | 'system' | 'file' | 'email_sent';
  metadata?: {
    email?: string;
    name?: string;
    subject?: string;
    fileUrl?: string;
    fileName?: string;
    ticketId?: string;
  };
}

export interface ChatSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  agentId?: string;
  agentName?: string;
  customerEmail?: string;
  customerName?: string;
  messages: Message[];
  tags?: string[];
  rating?: number;
  feedback?: string;
}

export interface BusinessHours {
  timezone: string;
  monday: { open: string; close: string; enabled: boolean };
  tuesday: { open: string; close: string; enabled: boolean };
  wednesday: { open: string; close: string; enabled: boolean };
  thursday: { open: string; close: string; enabled: boolean };
  friday: { open: string; close: string; enabled: boolean };
  saturday: { open: string; close: string; enabled: boolean };
  sunday: { open: string; close: string; enabled: boolean };
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'orders' | 'returns' | 'other';
}

interface ChatStore {
  // State
  isOpen: boolean;
  isMinimized: boolean;
  currentSession: ChatSession | null;
  messages: Message[];
  isTyping: boolean;
  agentTyping: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isBusinessHours: boolean;
  showContactForm: boolean;
  unreadCount: number;
  
  // Business hours
  businessHours: BusinessHours;
  
  // Actions
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  toggleChat: () => void;
  
  // Message actions
  sendMessage: (text: string) => void;
  receiveMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  markMessagesAsRead: () => void;
  clearMessages: () => void;
  
  // Session management
  startSession: (customerData?: { name?: string; email?: string }) => void;
  endSession: (rating?: number, feedback?: string) => void;
  updateSession: (updates: Partial<ChatSession>) => void;
  
  // Business hours and contact form
  checkBusinessHours: () => void;
  showContactFormView: () => void;
  hideContactFormView: () => void;
  submitContactForm: (data: ContactFormData) => Promise<boolean>;
  
  // Connection status
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  setAgentTyping: (typing: boolean) => void;
  setUserTyping: (typing: boolean) => void;
  
  // Utilities
  getMessageHistory: () => Message[];
  exportChatHistory: () => string;
  getSessionDuration: () => number;
}

// Business hours configuration (EST timezone)
const defaultBusinessHours: BusinessHours = {
  timezone: 'America/New_York',
  monday: { open: '09:00', close: '17:00', enabled: true },
  tuesday: { open: '09:00', close: '17:00', enabled: true },
  wednesday: { open: '09:00', close: '17:00', enabled: true },
  thursday: { open: '09:00', close: '17:00', enabled: true },
  friday: { open: '09:00', close: '17:00', enabled: true },
  saturday: { open: '10:00', close: '15:00', enabled: true },
  sunday: { open: '10:00', close: '15:00', enabled: false },
};

// Helper function to check if current time is within business hours
const isWithinBusinessHours = (businessHours: BusinessHours): boolean => {
  try {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()] as keyof typeof businessHours;
    
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
};

// Generate unique message ID
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isMinimized: false,
      currentSession: null,
      messages: [],
      isTyping: false,
      agentTyping: false,
      connectionStatus: 'disconnected',
      isBusinessHours: isWithinBusinessHours(defaultBusinessHours),
      showContactForm: false,
      unreadCount: 0,
      businessHours: defaultBusinessHours,

      // Chat controls
      openChat: () => {
        set((state) => {
          // Check business hours when opening chat
          const isBusinessOpen = isWithinBusinessHours(state.businessHours);
          
          // If outside business hours and no active session, show contact form
          const shouldShowForm = !isBusinessOpen && !state.currentSession;
          
          return {
            isOpen: true,
            isMinimized: false,
            isBusinessHours: isBusinessOpen,
            showContactForm: shouldShowForm,
            unreadCount: 0, // Clear unread count when opening
          };
        });
      },

      closeChat: () => {
        set({
          isOpen: false,
          isMinimized: false,
          showContactForm: false,
        });
      },

      minimizeChat: () => {
        set({ isMinimized: true });
      },

      maximizeChat: () => {
        set({ isMinimized: false });
      },

      toggleChat: () => {
        const { isOpen } = get();
        if (isOpen) {
          get().closeChat();
        } else {
          get().openChat();
        }
      },

      // Message handling
      sendMessage: (text) => {
        const message: Message = {
          id: generateMessageId(),
          text: text.trim(),
          timestamp: new Date(),
          isFromUser: true,
          isRead: true,
        };

        set((state) => {
          const updatedMessages = [...state.messages, message];
          
          // Update current session if active
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
          } : null;

          return {
            messages: updatedMessages,
            currentSession: updatedSession,
            isTyping: false,
          };
        });

        // Simulate agent response (in real implementation, this would be handled by WebSocket)
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            get().setAgentTyping(true);
            
            setTimeout(() => {
              get().receiveMessage({
                text: "Thanks for your message! An agent will be with you shortly. How can we help you today?",
                isFromUser: false,
                messageType: 'text',
              });
              get().setAgentTyping(false);
            }, 1500);
          }, 500);
        }
      },

      receiveMessage: (messageData) => {
        const message: Message = {
          id: generateMessageId(),
          timestamp: new Date(),
          isRead: false,
          ...messageData,
        };

        set((state) => {
          const updatedMessages = [...state.messages, message];
          
          // Update current session if active
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
          } : null;

          // Increment unread count if chat is not open
          const newUnreadCount = !state.isOpen ? state.unreadCount + 1 : state.unreadCount;

          return {
            messages: updatedMessages,
            currentSession: updatedSession,
            unreadCount: newUnreadCount,
          };
        });
      },

      markMessagesAsRead: () => {
        set((state) => ({
          messages: state.messages.map(msg => ({ ...msg, isRead: true })),
          unreadCount: 0,
        }));
      },

      clearMessages: () => {
        set({
          messages: [],
          unreadCount: 0,
        });
      },

      // Session management
      startSession: (customerData = {}) => {
        const session: ChatSession = {
          id: generateSessionId(),
          startTime: new Date(),
          isActive: true,
          customerEmail: customerData.email,
          customerName: customerData.name,
          messages: [],
        };

        set((state) => ({
          currentSession: session,
          connectionStatus: 'connected',
          // Add welcome message
          messages: [...state.messages, {
            id: generateMessageId(),
            text: `Welcome${customerData.name ? `, ${customerData.name}` : ''}! You're now connected with our support team. How can we help you today?`,
            timestamp: new Date(),
            isFromUser: false,
            isRead: false,
            messageType: 'system',
          }],
        }));
      },

      endSession: (rating, feedback) => {
        set((state) => {
          if (!state.currentSession) return state;

          const endedSession: ChatSession = {
            ...state.currentSession,
            endTime: new Date(),
            isActive: false,
            rating,
            feedback,
          };

          return {
            currentSession: null,
            connectionStatus: 'disconnected',
            // Add goodbye message
            messages: [...state.messages, {
              id: generateMessageId(),
              text: "Thank you for contacting us! This chat session has ended. Feel free to start a new chat if you need further assistance.",
              timestamp: new Date(),
              isFromUser: false,
              isRead: false,
              messageType: 'system',
            }],
          };
        });
      },

      updateSession: (updates) => {
        set((state) => ({
          currentSession: state.currentSession ? {
            ...state.currentSession,
            ...updates,
          } : null,
        }));
      },

      // Business hours and contact form
      checkBusinessHours: () => {
        set((state) => ({
          isBusinessHours: isWithinBusinessHours(state.businessHours),
        }));
      },

      showContactFormView: () => {
        set({ showContactForm: true });
      },

      hideContactFormView: () => {
        set({ showContactForm: false });
      },

      submitContactForm: async (data: ContactFormData): Promise<boolean> => {
        try {
          // Call the contact API
          const response = await fetch('/api/chat/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Add system message about form submission
            const systemMessage: Message = {
              id: generateMessageId(),
              text: `Thank you for your message! We've received your ${data.priority} priority inquiry about "${data.subject}" and will respond via email within 24 hours. Your ticket ID is: ${result.ticketId}`,
              timestamp: new Date(),
              isFromUser: false,
              isRead: false,
              messageType: 'email_sent',
              metadata: {
                email: data.email,
                name: data.name,
                subject: data.subject,
                ticketId: result.ticketId,
              },
            };

            set((state) => ({
              messages: [...state.messages, systemMessage],
              showContactForm: false,
            }));

            return true;
          } else {
            console.error('Contact form submission failed:', result);
            return false;
          }
        } catch (error) {
          console.error('Error submitting contact form:', error);
          return false;
        }
      },

      // Connection status
      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      setAgentTyping: (typing) => {
        set({ agentTyping: typing });
      },

      setUserTyping: (typing) => {
        set({ isTyping: typing });
      },

      // Utilities
      getMessageHistory: () => {
        return get().messages;
      },

      exportChatHistory: () => {
        const { messages, currentSession } = get();
        const chatData = {
          session: currentSession,
          messages,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(chatData, null, 2);
      },

      getSessionDuration: () => {
        const { currentSession } = get();
        if (!currentSession) return 0;
        
        const endTime = currentSession.endTime || new Date();
        const startTime = currentSession.startTime;
        return Math.round((endTime.getTime() - startTime.getTime()) / 1000); // Duration in seconds
      },
    }),
    {
      name: 'aurora-chat-store',
      partialize: (state) => ({
        messages: state.messages,
        businessHours: state.businessHours,
        // Don't persist UI state like isOpen, isMinimized, etc.
      }),
    }
  )
);

// Selectors for optimized performance
export const useChatMessages = () => useChatStore(state => state.messages);
export const useChatOpen = () => useChatStore(state => state.isOpen);
export const useChatUnreadCount = () => useChatStore(state => state.unreadCount);
export const useBusinessHours = () => useChatStore(state => state.isBusinessHours);
export const useChatSession = () => useChatStore(state => state.currentSession);
export const useChatConnection = () => useChatStore(state => state.connectionStatus);
export const useAgentTyping = () => useChatStore(state => state.agentTyping);