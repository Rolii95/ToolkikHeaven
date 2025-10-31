'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Minus, 
  Send, 
  Clock, 
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useChatStore } from '../lib/store/chatStore';
import { useToast } from './ToastProvider';

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  companyName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  position = 'bottom-right',
  theme = 'light',
  companyName = 'Aurora Commerce',
  supportEmail = 'support@auroracommerce.com',
  supportPhone = '+1 (555) 123-4567'
}) => {
  const {
    isOpen,
    isMinimized,
    messages,
    unreadCount,
    isBusinessHours,
    showContactForm,
    agentTyping,
    connectionStatus,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    markMessagesAsRead,
    checkBusinessHours,
    showContactFormView,
    hideContactFormView,
    submitContactForm,
    startSession,
  } = useChatStore();

  const { addToast } = useToast();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium' as const,
    category: 'general' as const,
  });

  // Check business hours on mount and periodically
  useEffect(() => {
    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkBusinessHours]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      markMessagesAsRead();
    }
  }, [isOpen, isMinimized, markMessagesAsRead]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Theme classes
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    sendMessage(messageInput);
    setMessageInput('');
    setIsTyping(false);

    // Start session if not already active
    if (!useChatStore.getState().currentSession) {
      startSession();
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactFormData.name || !contactFormData.email || !contactFormData.message) {
      addToast({
        type: 'error',
        title: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const success = await submitContactForm(contactFormData);
      if (success) {
        addToast({
          type: 'success',
          title: 'Message sent successfully!',
          message: 'We\'ll get back to you soon.'
        });
        setContactFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'medium',
          category: 'general',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'An error occurred. Please try again.'
      });
    }
  };

  const handleInputChange = (text: string) => {
    setMessageInput(text);
    setIsTyping(text.length > 0);
  };

  // Chat Button (when closed)
  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <button
          onClick={openChat}
          className={`
            flex items-center justify-center w-14 h-14 
            bg-blue-600 hover:bg-blue-700 
            text-white rounded-full shadow-lg 
            transition-all duration-300 hover:scale-110
            focus:outline-none focus:ring-4 focus:ring-blue-300
          `}
          aria-label="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    );
  }

  // Main Chat Window
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className={`
        w-80 sm:w-96 transition-all duration-300
        ${isMinimized ? 'h-14' : 'h-96 sm:h-[500px]'}
        ${themeClasses}
        border rounded-lg shadow-xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{companyName} Support</h3>
              <div className="flex items-center gap-1 text-xs">
                <div className={`w-2 h-2 rounded-full ${isBusinessHours ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span>{isBusinessHours ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={isMinimized ? maximizeChat : minimizeChat}
              className="p-1 hover:bg-blue-700 rounded"
              aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <button
              onClick={closeChat}
              className="p-1 hover:bg-blue-700 rounded"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {showContactForm ? (
                // Contact Form View
                <div className="h-80 sm:h-96 p-4 overflow-y-auto">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <h4 className="font-semibold">We're currently offline</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Our support team is currently offline. Please leave a message and we'll get back to you within 24 hours.
                    </p>
                  </div>

                  <form onSubmit={handleContactFormSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Subject</label>
                      <input
                        type="text"
                        value={contactFormData.subject}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                          value={contactFormData.priority}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                          value={contactFormData.category}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="billing">Billing</option>
                          <option value="orders">Orders</option>
                          <option value="returns">Returns</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Message *</label>
                      <textarea
                        value={contactFormData.message}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Please describe your issue..."
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Send Message
                      </button>
                      <button
                        type="button"
                        onClick={hideContactFormView}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  {/* Alternative Contact Methods */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-2">Or contact us directly:</p>
                    <div className="space-y-1">
                      <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                        <Mail className="w-3 h-3" />
                        {supportEmail}
                      </a>
                      <a href={`tel:${supportPhone}`} className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                        <Phone className="w-3 h-3" />
                        {supportPhone}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                // Chat Messages View
                <div className="h-80 sm:h-96 flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Start a conversation with our support team!</p>
                        {!isBusinessHours && (
                          <button
                            onClick={showContactFormView}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Or leave us a message
                          </button>
                        )}
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            flex gap-2 max-w-[80%]
                            ${message.isFromUser ? 'flex-row-reverse' : 'flex-row'}
                          `}>
                            {/* Avatar */}
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs
                              ${message.isFromUser 
                                ? 'bg-blue-600 text-white' 
                                : message.messageType === 'system' 
                                  ? 'bg-gray-500 text-white'
                                  : 'bg-green-600 text-white'
                              }
                            `}>
                              {message.isFromUser ? (
                                <User className="w-3 h-3" />
                              ) : message.messageType === 'system' ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <Bot className="w-3 h-3" />
                              )}
                            </div>

                            {/* Message */}
                            <div className={`
                              px-3 py-2 rounded-lg text-sm
                              ${message.isFromUser 
                                ? 'bg-blue-600 text-white' 
                                : message.messageType === 'system'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            `}>
                              <p>{message.text}</p>
                              {message.messageType === 'email_sent' && (
                                <div className="mt-1 flex items-center gap-1 text-xs opacity-75">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Email sent</span>
                                </div>
                              )}
                              <div className="text-xs opacity-75 mt-1">
                                {message.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Agent Typing Indicator */}
                    {agentTyping && (
                      <div className="flex justify-start">
                        <div className="flex gap-2">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs text-white">
                            <Bot className="w-3 h-3" />
                          </div>
                          <div className="bg-gray-100 px-3 py-2 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isBusinessHours && !useChatStore.getState().currentSession}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || (!isBusinessHours && !useChatStore.getState().currentSession)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {!isBusinessHours && !useChatStore.getState().currentSession && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                        <span>We're currently offline</span>
                        <button
                          onClick={showContactFormView}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Leave a message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;