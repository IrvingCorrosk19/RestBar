const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Obtener todos los clientes
router.get('/', clientController.getAllClients);

// Obtener un cliente por ID
router.get('/:id', clientController.getClientById);

// Crear un nuevo cliente
router.post('/', clientController.createClient);

// Actualizar un cliente
router.put('/:id', clientController.updateClient);

// Eliminar un cliente
router.delete('/:id', clientController.deleteClient);

module.exports = router; 