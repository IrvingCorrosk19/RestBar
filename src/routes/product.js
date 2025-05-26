const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorize('ADMIN'));

router.get('/', productController.getAll);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.patch('/:id/deactivate', productController.deactivate);

module.exports = router; 