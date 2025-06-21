// metrics.js

const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// (Optional) collect default process metrics (nodejs_cpu_user_seconds_total, etc)
client.collectDefaultMetrics({ register });

// Define our custom metrics
const logCount = new client.Counter({
  name: 'log_count_total',
  help: 'Total number of logs generated',
  labelNames: ['level', 'service']
});

const responseTimeGauge = new client.Gauge({
  name: 'response_time_ms',
  help: 'Response time in ms',
  labelNames: ['service']
});

const cpuUsageGauge = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
  labelNames: ['service']
});

const memoryUsageGauge = new client.Gauge({
  name: 'memory_usage_mb',
  help: 'Memory usage in MB',
  labelNames: ['service']
});

// Database-related metrics
const dbConnectionsGauge = new client.Gauge({
  name: 'db_connections_total',
  help: 'Total database connections',
  labelNames: ['status'] // active, idle, waiting
});

const dbOperationsCounter = new client.Counter({
  name: 'db_operations_total',
  help: 'Total database operations',
  labelNames: ['operation', 'status'] // operation: insert, select, update, delete; status: success, error
});

const dbQueryDurationHistogram = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const dbLogsSavedCounter = new client.Counter({
  name: 'db_logs_saved_total',
  help: 'Total number of logs saved to database',
  labelNames: ['level', 'service']
});

// Register the custom metrics
register.registerMetric(logCount);
register.registerMetric(responseTimeGauge);
register.registerMetric(cpuUsageGauge);
register.registerMetric(memoryUsageGauge);
register.registerMetric(dbConnectionsGauge);
register.registerMetric(dbOperationsCounter);
register.registerMetric(dbQueryDurationHistogram);
register.registerMetric(dbLogsSavedCounter);

// Function to update metrics based on a log entry
const updateMetrics = (log) => {
  const { level, service, metrics } = log;
  
  // Increment the log count counter
  logCount.inc({ level, service }, 1);
  
  // Update gauges
  responseTimeGauge.set({ service }, metrics.responseTime);
  cpuUsageGauge.set({ service }, metrics.cpuUsage);
  memoryUsageGauge.set({ service }, metrics.memoryUsage);
};

// Function to update database connection metrics
const updateDatabaseMetrics = (connectionInfo) => {
  if (connectionInfo.status === 'connected') {
    dbConnectionsGauge.set({ status: 'total' }, connectionInfo.totalConnections || 0);
    dbConnectionsGauge.set({ status: 'idle' }, connectionInfo.idleConnections || 0);
    dbConnectionsGauge.set({ status: 'waiting' }, connectionInfo.waitingConnections || 0);
  }
};

// Function to record database operation
const recordDatabaseOperation = (operation, status, duration = null) => {
  dbOperationsCounter.inc({ operation, status }, 1);
  
  if (duration !== null) {
    dbQueryDurationHistogram.observe({ operation }, duration);
  }
};

// Function to record saved log
const recordLogSaved = (level, service) => {
  dbLogsSavedCounter.inc({ level, service }, 1);
};

module.exports = {
  register,
  updateMetrics,
  updateDatabaseMetrics,
  recordDatabaseOperation,
  recordLogSaved
};
