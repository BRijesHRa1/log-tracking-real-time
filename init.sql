-- init.sql
-- Database initialization script for log tracking

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL,
    service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    request_id VARCHAR(20) NOT NULL,
    response_time INTEGER,
    cpu_usage DECIMAL(5,2),
    memory_usage INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Create a view for recent logs (last 24 hours)
CREATE OR REPLACE VIEW recent_logs AS
SELECT * FROM logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create a view for log statistics
CREATE OR REPLACE VIEW log_stats AS
SELECT 
    service,
    level,
    COUNT(*) as count,
    AVG(response_time) as avg_response_time,
    AVG(cpu_usage) as avg_cpu_usage,
    AVG(memory_usage) as avg_memory_usage,
    MIN(created_at) as first_log,
    MAX(created_at) as last_log
FROM logs 
GROUP BY service, level;

-- Insert some sample data
INSERT INTO logs (level, service, message, request_id, response_time, cpu_usage, memory_usage) VALUES
('INFO', 'api', 'Application started successfully', 'init001', 120, 15.5, 256),
('INFO', 'database', 'Database connection established', 'init002', 45, 8.2, 128),
('INFO', 'auth', 'Authentication service ready', 'init003', 89, 12.1, 192); 