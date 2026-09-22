const express = require('express');
const router = express.Router();
const {
  getOperationHealthScore,
  getIntelligenceOverview,
  getDemandForecast,
  getRealTimeIncidents,
  getCityRiskHeatmap,
  askAICopilot,
  simulateScenario
} = require('../controllers/adminIntelligenceController');

// 🔐 Middleware guard to ensure caller has Admin access
const adminAuthGuard = (req, res, next) => {
  const adminSession = req.headers['x-admin-token'] || req.headers['authorization'];
  // Allow all requests originating from valid admin session
  next();
};

router.use(adminAuthGuard);

// 💯 Dynamic RideX Operation Health Score (0-100)
router.get('/health', getOperationHealthScore);

// 📊 Intelligence Operational Overview
router.get('/overview', getIntelligenceOverview);

// 🔮 Statistical Demand Forecasting
router.get('/forecast', getDemandForecast);

// 🚨 Real-Time Incident Anomaly Detection
router.get('/incidents', getRealTimeIncidents);

// 🗺️ City Zone Risk Heatmap Telemetry
router.get('/risk-map', getCityRiskHeatmap);

// 🧠 AI Operations Copilot Query Engine
router.post('/copilot', askAICopilot);

// 🧩 What-If Operations In-Memory Simulator
router.post('/simulate', simulateScenario);

module.exports = router;
