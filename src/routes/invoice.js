const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

// Listar facturas (ADMIN, MANAGER, CASHIER)
router.get('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.getAll);

// Crear factura (ADMIN, MANAGER, CASHIER)
router.post('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.create);

// Ver detalle de factura (ADMIN, MANAGER, CASHIER)
router.get('/:id', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.getById);

// Anular factura (ADMIN, MANAGER, CASHIER)
router.patch('/:id/cancel', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.cancel);

// Descargar PDF de factura (ADMIN, MANAGER, CASHIER)
router.get('/:id/pdf', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.downloadPDF);

// Enviar factura por email
router.post('/:id/email', authenticateToken, authorize('ADMIN', 'MANAGER', 'CASHIER'), invoiceController.sendByEmail);

module.exports = router; 