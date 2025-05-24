const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', productController.getAll);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.patch('/:id/deactivate', productController.deactivate);

module.exports = router; 