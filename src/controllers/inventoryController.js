const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar movimientos de inventario
exports.getAll = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos de inventario', error });
  }
};

// Crear movimiento de inventario (entrada, salida, ajuste)
exports.create = async (req, res) => {
  const { productId, quantity, type, notes, alertThreshold } = req.body;
  try {
    // Registrar movimiento
    const movement = await prisma.inventory.create({
      data: { productId, quantity, type, notes, alertThreshold },
    });
    // Actualizar stock del producto
    const product = await prisma.product.findUnique({ where: { id: productId } });
    let newStock = product.stock;
    if (type === 'IN') newStock += quantity;
    else if (type === 'OUT') newStock -= quantity;
    else if (type === 'ADJUSTMENT') newStock = quantity;
    await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar movimiento de inventario', error });
  }
};

// Consultar productos con stock bajo
exports.lowStock = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        stock: { lte: 5 }, // Puedes ajustar este valor o usar alertThreshold
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar productos con bajo stock', error });
  }
}; 