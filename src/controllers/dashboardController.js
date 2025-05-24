const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');

// Ventas totales por día (últimos 30 días)
exports.salesByDay = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, SUM(total) as sales
      FROM "Order"
      WHERE status = 'DELIVERED' AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas por día', error });
  }
};

// Productos más vendidos (top 5)
exports.topProducts = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT p.name, SUM(oi.quantity) as total_sold
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 5;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos más vendidos', error });
  }
};

// Pedidos por estado
exports.ordersByStatus = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM "Order"
      GROUP BY status;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos por estado', error });
  }
};

// Mesas más ocupadas (top 5)
exports.topTables = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT t.number, COUNT(o.id) as times_used
      FROM "Order" o
      JOIN "Table" t ON o."tableId" = t.id
      GROUP BY t.number
      ORDER BY times_used DESC
      LIMIT 5;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mesas más ocupadas', error });
  }
};

// Alertas activas (stock bajo, reservas próximas)
exports.activeAlerts = async (req, res) => {
  try {
    const lowStock = await prisma.product.findMany({ where: { active: true, stock: { lte: 5 } } });
    const upcomingReservations = await prisma.reservation.findMany({
      where: { status: 'CONFIRMED', startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      take: 5,
    });
    res.json({ lowStock, upcomingReservations });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener alertas activas', error });
  }
};

// Reporte de ventas por rango de fechas
exports.salesReport = async (req, res) => {
  const { start, end } = req.query;
  try {
    const where = {
      status: 'DELIVERED',
      createdAt: {
        gte: start ? new Date(start) : undefined,
        lte: end ? new Date(end) : undefined,
      },
    };
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        table: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const report = orders.map(order => ({
      id: order.id,
      fecha: order.createdAt,
      mesa: order.table?.number,
      usuario: order.user?.name,
      total: order.total,
      productos: order.items.map(i => `${i.product?.name} x${i.quantity}`).join(', '),
    }));
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar reporte', error });
  }
};

// Exportar reporte de ventas a CSV
exports.salesReportCSV = async (req, res) => {
  const { start, end } = req.query;
  try {
    const where = {
      status: 'DELIVERED',
      createdAt: {
        gte: start ? new Date(start) : undefined,
        lte: end ? new Date(end) : undefined,
      },
    };
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        table: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const report = orders.map(order => ({
      id: order.id,
      fecha: order.createdAt,
      mesa: order.table?.number,
      usuario: order.user?.name,
      total: order.total,
      productos: order.items.map(i => `${i.product?.name} x${i.quantity}`).join(', '),
    }));
    const parser = new Parser();
    const csv = parser.parse(report);
    res.header('Content-Type', 'text/csv');
    res.attachment('reporte_ventas.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error al exportar CSV', error });
  }
};

// Reporte de ventas por producto
exports.productSalesReport = async (req, res) => {
  const { start, end } = req.query;
  try {
    const where = {
      order: {
        status: 'DELIVERED',
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
    };
    const items = await prisma.orderItem.findMany({
      where,
      include: {
        product: true,
        order: true,
      },
    });
    // Agrupar por producto
    const grouped = items.reduce((acc, item) => {
      const key = item.product?.id;
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = {
          producto: item.product.name,
          cantidad: 0,
          total: 0,
        };
      }
      acc[key].cantidad += item.quantity;
      acc[key].total += item.price * item.quantity;
      return acc;
    }, {});
    const report = Object.values(grouped);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar reporte por producto', error });
  }
};

// Exportar reporte de ventas por producto a CSV
exports.productSalesReportCSV = async (req, res) => {
  const { start, end } = req.query;
  try {
    const where = {
      order: {
        status: 'DELIVERED',
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
    };
    const items = await prisma.orderItem.findMany({
      where,
      include: {
        product: true,
        order: true,
      },
    });
    const grouped = items.reduce((acc, item) => {
      const key = item.product?.id;
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = {
          producto: item.product.name,
          cantidad: 0,
          total: 0,
        };
      }
      acc[key].cantidad += item.quantity;
      acc[key].total += item.price * item.quantity;
      return acc;
    }, {});
    const report = Object.values(grouped);
    const parser = new Parser();
    const csv = parser.parse(report);
    res.header('Content-Type', 'text/csv');
    res.attachment('reporte_ventas_producto.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error al exportar CSV por producto', error });
  }
};

// Rendimiento de empleados
exports.employeePerformance = async (req, res) => {
  try {
    const { employee, period } = req.query;
    let dateFilter = '';

    switch (period) {
      case 'today':
        dateFilter = "DATE(o.createdAt) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "DATE(o.createdAt) >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "DATE(o.createdAt) >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "DATE(o.createdAt) = CURRENT_DATE";
    }

    const employeeFilter = employee && employee !== 'all' 
      ? `AND u.id = '${employee}'` 
      : '';

    const query = `
      WITH employee_metrics AS (
        SELECT 
          u.id,
          u.name,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total), 0) as total_sales,
          COALESCE(AVG(o.total), 0) as avg_order_value,
          COUNT(DISTINCT CASE WHEN o.status = 'COMPLETED' THEN o.id END) as completed_orders,
          CASE 
            WHEN COUNT(DISTINCT o.id) > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN o.status = 'COMPLETED' THEN o.id END)::float / COUNT(DISTINCT o.id)::float) * 100, 2)
            ELSE 0 
          END as completion_rate
        FROM "User" u
        LEFT JOIN "Order" o ON u.id = o."userId" AND ${dateFilter}
        WHERE u.role IN ('WAITER', 'CASHIER')
        ${employeeFilter}
        GROUP BY u.id, u.name
      )
      SELECT 
        id,
        name,
        total_orders as "totalOrders",
        total_sales as "totalSales",
        avg_order_value as "avgOrderValue",
        completed_orders as "completedOrders",
        completion_rate as "completionRate"
      FROM employee_metrics
      ORDER BY total_sales DESC
    `;

    const results = await prisma.$queryRawUnsafe(query);

    if (!results || results.length === 0) {
      return res.json([]);
    }

    res.json(results);
  } catch (error) {
    console.error('Error en employeePerformance:', error);
    res.status(500).json({ 
      error: 'Error al obtener el rendimiento de empleados',
      details: error.message 
    });
  }
}; 