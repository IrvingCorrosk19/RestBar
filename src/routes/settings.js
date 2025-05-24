const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Obtener configuración
router.get('/', authenticateToken, settingsController.getSettings);

// Actualizar configuración
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);

module.exports = router; 