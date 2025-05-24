const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Listar facturas (ADMIN, MANAGER, CASHIER)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.getAll);

// Crear factura (ADMIN, MANAGER, CASHIER)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.create);

// Ver detalle de factura (ADMIN, MANAGER, CASHIER)
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.getById);

// Anular factura (ADMIN, MANAGER, CASHIER)
router.patch('/:id/cancel', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.cancel);

// Descargar PDF de factura (ADMIN, MANAGER, CASHIER)
router.get('/:id/pdf', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.downloadPDF);

// Enviar factura por email
router.post('/:id/email', authenticateToken, authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.sendByEmail);

module.exports = router; 