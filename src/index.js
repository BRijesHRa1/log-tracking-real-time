const express = require('express');
const { generateLogEntry } = require('./util');
const { register, updateMetrics } = require('./metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Prometheus scraping endpoint
app.get('/metrics', async (req, res) => {
  try {
    // tell prom-client to return the correct headers
    res.set('Content-Type', register.contentType);
    // send all metrics
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// On each browser refresh, generate a new log, update metrics, and return it
app.get('/', (req, res) => {
  const log = generateLogEntry();
  updateMetrics(log);
  res.json(log);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});
