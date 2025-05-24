const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', reservationController.getAll);
router.post('/', reservationController.create);
router.patch('/:id/cancel', reservationController.cancel);

module.exports = router; 