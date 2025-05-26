const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorize('ADMIN'));

router.get('/', userController.getAll);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.patch('/:id/deactivate', userController.deactivate);

module.exports = router; 