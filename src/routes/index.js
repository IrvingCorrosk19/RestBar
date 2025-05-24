const express = require('express');
const router = express.Router();

const settingsRoutes = require('./settings');
const clientRoutes = require('./client');

// Configuración
router.use('/api/settings', settingsRoutes);
router.use('/api/clients', clientRoutes);

module.exports = router; 