const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', tableController.getAll);
router.post('/', tableController.create);
router.put('/:id', tableController.update);
router.patch('/:id/deactivate', tableController.deactivate);

module.exports = router; 