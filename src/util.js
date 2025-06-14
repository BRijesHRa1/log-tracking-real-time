const generateLogEntry = () => {
  const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const services = ['api', 'auth', 'database', 'frontend', 'cache'];
  const messages = [
    'Request processed successfully',
    'Connection timeout',
    'Authentication failed',
    'Database query completed',
    'Cache miss',
    'Memory usage high',
    'API rate limit reached',
    'User session expired'
  ];
  
  const timestamp = new Date().toISOString();
  const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
  const service = services[Math.floor(Math.random() * services.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const requestId = Math.random().toString(36).substring(2, 10);
  
  return {
    timestamp,
    level: logType,
    service,
    message,
    requestId,
    metrics: {
      responseTime: Math.floor(Math.random() * 500),
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.floor(Math.random() * 1024)
    }
  };
};

module.exports = {
  generateLogEntry
};
