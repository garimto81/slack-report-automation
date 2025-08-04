-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
    channel_id VARCHAR(50) NOT NULL,
    analysis JSONB NOT NULL,
    sent_to VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Indexes for common queries
    INDEX idx_reports_type (type),
    INDEX idx_reports_channel_id (channel_id),
    INDEX idx_reports_created_at (created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage reports" ON reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);