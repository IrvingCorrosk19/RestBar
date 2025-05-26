const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const reservationController = require('../controllers/reservationController');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorize('ADMIN'));

router.get('/', reservationController.getAll);
router.post('/', reservationController.create);
router.patch('/:id/cancel', reservationController.cancel);

module.exports = router; 