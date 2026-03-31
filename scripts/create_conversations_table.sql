-- Create conversations table for persistent chat history
-- Run this in Supabase SQL Editor

CREATE TABLE conversations (
    phone TEXT PRIMARY KEY,
    phase TEXT DEFAULT 'START',
    history JSONB DEFAULT '[]'::jsonb,
    name TEXT,
    aesthetic_goal TEXT,
    source TEXT DEFAULT 'ORGANIC',
    trigger_message TEXT,
    full_name TEXT,
    email TEXT,
    consultation_reason TEXT,
    data_complete BOOLEAN DEFAULT FALSE,
    payment_info_sent BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    metrics JSONB DEFAULT '{
        "first_contact": null,
        "first_response_ms": null,
        "reengagement_sent": false,
        "reengagement_recovered": false,
        "phase_timestamps": {
            "START": null,
            "EXTRACTION": null,
            "HOOK": null,
            "DATA_CAPTURE": null,
            "PAYMENT": null,
            "CLOSING": null
        }
    }'::jsonb
);

-- Add RLS policies if needed (for production)
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX idx_conversations_last_interaction ON conversations(last_interaction);
CREATE INDEX idx_conversations_phase ON conversations(phase);
