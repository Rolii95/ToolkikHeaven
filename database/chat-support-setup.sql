-- Chat Support System Database Schema
-- This file sets up all necessary tables for the chat support functionality

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    agent_id UUID REFERENCES auth.users(id),
    agent_name VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
    session_feedback TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_from_user BOOLEAN NOT NULL DEFAULT TRUE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'email_sent')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'orders', 'returns', 'other')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id),
    user_agent TEXT,
    ip_address INET,
    response_due_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Hours Configuration Table
CREATE TABLE IF NOT EXISTS business_hours_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    monday_enabled BOOLEAN DEFAULT TRUE,
    monday_open TIME DEFAULT '09:00',
    monday_close TIME DEFAULT '17:00',
    tuesday_enabled BOOLEAN DEFAULT TRUE,
    tuesday_open TIME DEFAULT '09:00',
    tuesday_close TIME DEFAULT '17:00',
    wednesday_enabled BOOLEAN DEFAULT TRUE,
    wednesday_open TIME DEFAULT '09:00',
    wednesday_close TIME DEFAULT '17:00',
    thursday_enabled BOOLEAN DEFAULT TRUE,
    thursday_open TIME DEFAULT '09:00',
    thursday_close TIME DEFAULT '17:00',
    friday_enabled BOOLEAN DEFAULT TRUE,
    friday_open TIME DEFAULT '09:00',
    friday_close TIME DEFAULT '17:00',
    saturday_enabled BOOLEAN DEFAULT TRUE,
    saturday_open TIME DEFAULT '10:00',
    saturday_close TIME DEFAULT '15:00',
    sunday_enabled BOOLEAN DEFAULT FALSE,
    sunday_open TIME DEFAULT '10:00',
    sunday_close TIME DEFAULT '15:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Agent Availability Table
CREATE TABLE IF NOT EXISTS chat_agent_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chat_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_email ON chat_sessions(customer_email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_start_time ON chat_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_from_user ON chat_messages(is_from_user);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_ticket_id ON contact_submissions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON contact_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_agent_availability_agent_id ON chat_agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_agent_availability_is_online ON chat_agent_availability(is_online);

-- RLS (Row Level Security) Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_agent_availability ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
    FOR SELECT USING (
        customer_email = auth.jwt() ->> 'email' OR
        agent_id = auth.uid()
    );

CREATE POLICY "Agents can insert chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their chat sessions" ON chat_sessions
    FOR UPDATE USING (agent_id = auth.uid());

-- Policies for chat_messages
CREATE POLICY "Users can view messages from their sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND (chat_sessions.customer_email = auth.jwt() ->> 'email' OR chat_sessions.agent_id = auth.uid())
        )
    );

CREATE POLICY "Users and agents can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND (chat_sessions.customer_email = auth.jwt() ->> 'email' OR chat_sessions.agent_id = auth.uid())
        )
    );

-- Policies for contact_submissions
CREATE POLICY "Users can view their own contact submissions" ON contact_submissions
    FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Anyone can insert contact submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Policies for business_hours_config (read-only for non-admins)
CREATE POLICY "Anyone can view business hours" ON business_hours_config
    FOR SELECT USING (true);

-- Policies for chat_agent_availability
CREATE POLICY "Anyone can view agent availability" ON chat_agent_availability
    FOR SELECT USING (true);

CREATE POLICY "Agents can update their own availability" ON chat_agent_availability
    FOR ALL USING (agent_id = auth.uid());

-- Functions and Triggers

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_hours_config_updated_at BEFORE UPDATE ON business_hours_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_agent_availability_updated_at BEFORE UPDATE ON chat_agent_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TICKET-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket IDs
CREATE OR REPLACE FUNCTION set_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_id IS NULL OR NEW.ticket_id = '' THEN
        NEW.ticket_id := generate_ticket_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contact_submission_ticket_id 
    BEFORE INSERT ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION set_ticket_id();

-- Insert default business hours configuration
INSERT INTO business_hours_config (timezone, is_active) 
VALUES ('America/New_York', true)
ON CONFLICT DO NOTHING;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO chat_agent_availability (agent_id, agent_name, is_online, status)
-- VALUES 
--     (gen_random_uuid(), 'Support Agent 1', true, 'online'),
--     (gen_random_uuid(), 'Support Agent 2', false, 'offline')
-- ON CONFLICT (agent_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores chat support sessions between customers and agents';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions for offline support';
COMMENT ON TABLE business_hours_config IS 'Configures business hours for chat availability';
COMMENT ON TABLE chat_agent_availability IS 'Tracks online status and availability of support agents';

COMMENT ON COLUMN chat_sessions.session_rating IS 'Customer rating of the support session (1-5 stars)';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional message data (file URLs, email info, etc.)';
COMMENT ON COLUMN contact_submissions.ticket_id IS 'Unique ticket identifier for tracking';
COMMENT ON COLUMN contact_submissions.response_due_at IS 'When a response is due based on priority';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Chat support database schema setup completed successfully!';
    RAISE NOTICE 'Tables created: chat_sessions, chat_messages, contact_submissions, business_hours_config, chat_agent_availability';
    RAISE NOTICE 'Indexes, RLS policies, and triggers have been configured.';
END $$;