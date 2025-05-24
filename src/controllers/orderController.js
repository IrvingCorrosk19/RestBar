const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar todos los pedidos (admin, cocina, bar, mesero)
exports.getAll = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos', error });
  }
};

// Crear pedido (mesero)
exports.create = async (req, res) => {
  const { tableId, items, notes } = req.body;
  try {
    // Calcular total y determinar tipo de pedido
    let total = 0;
    let hasKitchenItems = false;
    let hasBarItems = false;

    for (const item of items) {
      const product = await prisma.product.findUnique({ 
        where: { id: item.productId },
        include: { category: true }
      });
      total += product.price * item.quantity;
      
      // Determinar tipo de pedido basado en la categoría
      if (product.category.name.toLowerCase().includes('bebida')) {
        hasBarItems = true;
      } else {
        hasKitchenItems = true;
      }
    }

    // Si tiene ambos tipos, asignar según el rol del usuario
    const type = hasKitchenItems && hasBarItems 
      ? (req.user.role === 'KITCHEN' ? 'KITCHEN' : 'BAR')
      : (hasKitchenItems ? 'KITCHEN' : 'BAR');

    // Crear pedido
    const order = await prisma.order.create({
      data: {
        tableId,
        userId: req.user.id,
        notes,
        total,
        type,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            status: 'PENDING',
          })),
        },
      },
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
      },
    });
    // Emitir evento de nuevo pedido
    if (req.io) req.io.emit('order:new', order);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear pedido', error });
  }
};

// Actualizar estado de pedido (cocina, bar, admin)
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
      },
    });
    // Emitir evento de actualización de pedido
    if (req.io) req.io.emit('order:update', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado del pedido', error });
  }
};

// Obtener detalle de pedido por ID
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
        invoice: true,
      },
    });
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedido', error });
  }
}; 