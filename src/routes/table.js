const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const tableController = require('../controllers/tableController');

// Eliminar restricción global solo para ADMIN
// router.use(authenticateToken, authorize('ADMIN'));

router.get('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), tableController.getAll);
router.post('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), tableController.create);
router.put('/:id', authenticateToken, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), tableController.update);
router.patch('/:id/deactivate', authenticateToken, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), tableController.deactivate);

module.exports = router; 