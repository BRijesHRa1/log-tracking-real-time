const express = require('express');
const { generateLogEntry } = require('./util');
const { register, updateMetrics, updateDatabaseMetrics, recordDatabaseOperation, recordLogSaved } = require('./metrics');
const { saveLogEntry, getRecentLogs, getLogStats, getConnectionInfo, closePool } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Prometheus scraping endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Update database connection metrics before serving metrics
    const connectionInfo = await getConnectionInfo();
    updateDatabaseMetrics(connectionInfo);
    
    // tell prom-client to return the correct headers
    res.set('Content-Type', register.contentType);
    // send all metrics
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Generate a new log entry and save it to database
app.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    const log = generateLogEntry();
    
    // Update application metrics
    updateMetrics(log);
    
    // Save to database and record metrics
    const savedLog = await saveLogEntry(log);
    const operationDuration = (Date.now() - startTime) / 1000;
    
    recordDatabaseOperation('insert', 'success', operationDuration);
    recordLogSaved(log.level, log.service);
    
    res.json({
      message: 'Log entry created and saved',
      log: savedLog
    });
  } catch (error) {
    recordDatabaseOperation('insert', 'error');
    console.error('Error creating log entry:', error);
    res.status(500).json({ 
      error: 'Failed to create log entry',
      details: error.message 
    });
  }
});

// Get recent logs from database
app.get('/logs', async (req, res) => {
  try {
    const startTime = Date.now();
    const limit = parseInt(req.query.limit) || 50;
    const logs = await getRecentLogs(limit);
    const operationDuration = (Date.now() - startTime) / 1000;
    
    recordDatabaseOperation('select', 'success', operationDuration);
    
    res.json({
      message: 'Recent logs retrieved',
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    recordDatabaseOperation('select', 'error');
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch logs',
      details: error.message 
    });
  }
});

// Get log statistics
app.get('/stats', async (req, res) => {
  try {
    const startTime = Date.now();
    const stats = await getLogStats();
    const operationDuration = (Date.now() - startTime) / 1000;
    
    recordDatabaseOperation('select', 'success', operationDuration);
    
    res.json({
      message: 'Log statistics retrieved',
      stats: stats
    });
  } catch (error) {
    recordDatabaseOperation('select', 'error');
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const connectionInfo = await getConnectionInfo();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: connectionInfo
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Bulk generate logs endpoint (for testing)
app.post('/generate', async (req, res) => {
  try {
    const count = parseInt(req.body.count) || 10;
    const logs = [];
    
    for (let i = 0; i < count; i++) {
      const log = generateLogEntry();
      updateMetrics(log);
      
      const savedLog = await saveLogEntry(log);
      recordLogSaved(log.level, log.service);
      logs.push(savedLog);
    }
    
    recordDatabaseOperation('insert', 'success');
    
    res.json({
      message: `${count} log entries generated and saved`,
      logs: logs
    });
  } catch (error) {
    recordDatabaseOperation('insert', 'error');
    console.error('Error bulk generating logs:', error);
    res.status(500).json({ 
      error: 'Failed to generate logs',
      details: error.message 
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`Recent logs at http://localhost:${PORT}/logs`);
  console.log(`Statistics at http://localhost:${PORT}/stats`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});
