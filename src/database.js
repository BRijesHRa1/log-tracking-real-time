// database.js
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'log_tracking',
  user: process.env.DB_USER || 'loguser',
  password: process.env.DB_PASSWORD || 'logpass',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Function to save a log entry to the database
const saveLogEntry = async (logEntry) => {
  const { timestamp, level, service, message, requestId, metrics } = logEntry;
  
  const query = `
    INSERT INTO logs (timestamp, level, service, message, request_id, response_time, cpu_usage, memory_usage)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `;
  
  const values = [
    timestamp,
    level,
    service,
    message,
    requestId,
    metrics.responseTime,
    metrics.cpuUsage,
    metrics.memoryUsage
  ];
  
  try {
    const result = await pool.query(query, values);
    return { ...logEntry, id: result.rows[0].id, savedAt: result.rows[0].created_at };
  } catch (error) {
    console.error('Error saving log entry:', error);
    throw error;
  }
};

// Function to get recent logs
const getRecentLogs = async (limit = 50) => {
  const query = `
    SELECT id, timestamp, level, service, message, request_id, 
           response_time, cpu_usage, memory_usage, created_at
    FROM logs 
    ORDER BY created_at DESC 
    LIMIT $1
  `;
  
  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    throw error;
  }
};

// Function to get log statistics
const getLogStats = async () => {
  const query = `
    SELECT service, level, count, avg_response_time, avg_cpu_usage, avg_memory_usage
    FROM log_stats
    ORDER BY service, level
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching log stats:', error);
    throw error;
  }
};

// Function to get database connection info for health checks
const getConnectionInfo = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    return {
      status: 'connected',
      currentTime: result.rows[0].current_time,
      version: result.rows[0].postgres_version,
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingConnections: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Graceful shutdown
const closePool = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};

module.exports = {
  saveLogEntry,
  getRecentLogs,
  getLogStats,
  getConnectionInfo,
  closePool,
  pool
}; 