const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Listar pedidos (admin, cocina, bar, mesero)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getAll);

// Crear pedido (mesero)
router.post('/', authenticateToken, authorizeRoles('WAITER'), orderController.create);

// Actualizar estado de pedido (admin, cocina, bar)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR'), orderController.updateStatus);

// Obtener detalle de pedido por ID
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getById);

module.exports = router; 