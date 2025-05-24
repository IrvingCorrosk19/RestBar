const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol ADMIN o MANAGER
router.use(authenticateToken, authorizeRoles('ADMIN', 'MANAGER'));

router.get('/sales-by-day', dashboardController.salesByDay);
router.get('/top-products', dashboardController.topProducts);
router.get('/orders-by-status', dashboardController.ordersByStatus);
router.get('/top-tables', dashboardController.topTables);
router.get('/active-alerts', dashboardController.activeAlerts);
router.get('/sales-report', dashboardController.salesReport);
router.get('/sales-report/csv', dashboardController.salesReportCSV);
router.get('/product-sales-report', dashboardController.productSalesReport);
router.get('/product-sales-report/csv', dashboardController.productSalesReportCSV);
router.get('/employee-performance', dashboardController.employeePerformance);

module.exports = router; 