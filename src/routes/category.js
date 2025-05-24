const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.patch('/:id/deactivate', categoryController.deactivate);

module.exports = router; 