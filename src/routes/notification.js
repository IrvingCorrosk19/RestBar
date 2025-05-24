const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Listar notificaciones del usuario autenticado
router.get('/', authenticateToken, notificationController.getAll);

// Crear notificación (puede ser llamada por otros módulos)
router.post('/', authenticateToken, notificationController.create);

// Marcar notificación como leída
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);

module.exports = router; 