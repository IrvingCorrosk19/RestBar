const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Listar pedidos (admin, cocina, bar, mesero)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getAll);

// Crear pedido (mesero y admin)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'WAITER'), orderController.create);

// Obtener detalle de pedido por ID
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getById);

// Actualizar estado de pedido (admin, cocina, bar)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'KITCHEN', 'BAR'), orderController.updateStatus);

// Agregar pago a pedido (admin, mesero)
router.post('/:id/payments', authenticateToken, authorizeRoles('ADMIN', 'WAITER'), orderController.addPayment);

// Dividir cuenta (admin, mesero)
router.post('/:id/split', authenticateToken, authorizeRoles('ADMIN', 'WAITER'), orderController.splitAccount);

module.exports = router; 