const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');



// Obtener la orden pendiente de una mesa
router.get('/pending', (req, res, next) => {
  console.log(' Ruta /api/orders/pending alcanzada');
  next();
}, authenticateToken, authorize('ADMIN', 'WAITER'), orderController.getPendingByTable);

// Obtener pedidos activos (cocina, bar)
router.get('/active', authenticateToken, authorize('ADMIN', 'KITCHEN', 'BAR'), orderController.getActive);

// Endpoint temporal de depuración para ver el objeto recibido
router.post('/debug', (req, res) => {
  try {
    console.log("Pedido recibido (debug):", req.body);
    res.status(201).json({ message: 'Pedido recibido correctamente (debug)', data: req.body });
  } catch (error) {
    console.error(" Error al procesar pedido (debug):", error);
    res.status(500).json({ error: 'Error interno del servidor (debug)' });
  }
});

// ====================
// 🔁 RUTAS GENERALES
// ====================

// Listar todos los pedidos (admin, cocina, bar, mesero)
router.get('/', authenticateToken, authorize('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getAll);

// Crear pedido (mesero y admin)
router.post('/', authenticateToken, authorize('ADMIN', 'WAITER'), orderController.create);

// Actualizar los items de una orden existente
router.patch('/:id', authenticateToken, authorize('ADMIN', 'WAITER'), orderController.updateItems);

// Obtener detalle de pedido por ID (esto debe ir al final para no tapar las rutas anteriores)
router.get('/:id', authenticateToken, authorize('ADMIN', 'KITCHEN', 'BAR', 'WAITER'), orderController.getById);

// Actualizar estado de pedido (admin, cocina, bar)
router.patch('/:id/status', authenticateToken, authorize('ADMIN', 'KITCHEN', 'BAR'), orderController.updateStatus);

// Agregar pago a pedido (admin, mesero)
router.post('/:id/payments', authenticateToken, authorize('ADMIN', 'WAITER'), orderController.addPayment);

// Dividir cuenta (admin, mesero)
router.post('/:id/split', authenticateToken, authorize('ADMIN', 'WAITER'), orderController.splitAccount);

// Actualizar estado de item de pedido (admin, cocina, bar)
router.patch('/:orderId/items/:itemId/status', authenticateToken, authorize('ADMIN', 'KITCHEN', 'BAR'), orderController.updateItemStatus);

module.exports = router;
