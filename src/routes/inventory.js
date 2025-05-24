const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Listar movimientos de inventario (ADMIN, MANAGER, KITCHEN, BAR)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'KITCHEN', 'BAR'), inventoryController.getAll);

// Crear movimiento de inventario (ADMIN, MANAGER, KITCHEN, BAR)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'KITCHEN', 'BAR'), inventoryController.create);

// Consultar productos con stock bajo (ADMIN, MANAGER, KITCHEN, BAR)
router.get('/low-stock', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'KITCHEN', 'BAR'), inventoryController.lowStock);

module.exports = router; 