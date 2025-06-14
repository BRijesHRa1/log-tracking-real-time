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

// Register the custom metrics
register.registerMetric(logCount);
register.registerMetric(responseTimeGauge);
register.registerMetric(cpuUsageGauge);
register.registerMetric(memoryUsageGauge);

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

module.exports = {
  register,
  updateMetrics
};
