const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ORDER_TYPES, PAYMENT_STATUS, ORDER_STATUS } = require('../models/Order');

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

// Obtener pedidos activos por tipo (cocina/bar)
exports.getActive = async (req, res) => {
  try {
    const { type } = req.query;
    
    const orders = await prisma.order.findMany({
      where: {
        type: type,
        OR: [
          // Pedidos activos en cocina/bar
          {
            status: {
              in: ['PENDING', 'PREPARING']
            }
          },
          // Pedidos de mesas en cuenta
          {
            status: {
              in: ['READY', 'DELIVERED']
            },
            table: {
              status: 'EN_CUENTA'
            }
          }
        ]
      },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    res.status(500).json({ message: 'Error al obtener pedidos activos', error: error.message });
  }
};

// Crear pedido
exports.create = async (req, res) => {
  console.log('Pedido recibido en backend:', req.body);
  const {
    type,           // KITCHEN, BAR, TABLE, PERSONAL, TAKEAWAY
    tableId,        // Opcional, solo para pedidos de mesa
    clientId,       // Opcional, para pedidos personales o para llevar
    items,
    notes,
    paymentMethod,  // CASH, CARD, TRANSFER
    splitAccounts   // Opcional, para dividir la cuenta
  } = req.body;

  try {
    // 1. Validar tipo de pedido
    if (!Object.values(ORDER_TYPES).includes(type)) {
      return res.status(400).json({ 
        message: 'Tipo de pedido inválido',
        validTypes: Object.values(ORDER_TYPES)
      });
    }

    // 2. Validar mesa si es pedido de mesa
    if (type === ORDER_TYPES.TABLE) {
      if (!tableId) {
        return res.status(400).json({ message: 'Se requiere una mesa para pedidos de mesa' });
      }

      // Verificar estado de la mesa
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: { 
          accounts: true,
          reservations: {
            where: {
              status: 'CONFIRMED',
              startTime: {
                lte: new Date()
              },
              endTime: {
                gte: new Date()
              }
            },
            include: {
              customerProfile: true
            }
          }
        }
      });

      if (!table) {
        return res.status(404).json({ message: 'Mesa no encontrada' });
      }

      if (table.status === 'OCCUPIED') {
        return res.status(400).json({ message: 'La mesa ya está ocupada' });
      }
    }

    // 3. Calcular totales
    let subtotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado: ${item.productId}` });
      }

      if (!product.active) {
        return res.status(400).json({ message: `Producto no disponible: ${product.name}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Stock insuficiente para: ${product.name}` });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
    }

    const tax = subtotal * 0.19; // 19% IVA
    const total = subtotal + tax;

    // 4. Crear el pedido
    let finalClientId = clientId;
    if (!finalClientId) {
      // Buscar el cliente por defecto en la tabla Client
      const defaultClient = await prisma.client.findUnique({
        where: { email: 'default@restbar.com' }
      });
      if (defaultClient) {
        finalClientId = defaultClient.id;
      }
    }

    const orderData = {
      type,
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      total,
      notes,
      user: {
        connect: { id: req.user.id }
      },
      table: { connect: { id: tableId } },
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      },
      client: { connect: { id: finalClientId } }
    };

    if (type === ORDER_TYPES.PERSONAL || type === ORDER_TYPES.TAKEAWAY) {
      orderData.customerProfile = { connect: { id: finalClientId } };
    }

    const order = await prisma.order.create({
      data: orderData,
      include: {
        table: true,
        client: true,
        account: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Agregar subtotal calculado a cada item en la respuesta
    const orderWithSubtotals = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      }))
    };

    // 5. Actualizar estado de la mesa si es pedido de mesa
    if (type === ORDER_TYPES.TABLE) {
      await prisma.table.update({
        where: { id: tableId },
        data: { 
          status: 'OCCUPIED',
          // Agregar el pedido a la mesa
          orders: {
            connect: { id: order.id }
          }
        }
      });
    }

    // 6. Crear pago inicial si se especificó método de pago
    if (paymentMethod) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: paymentMethod,
          status: 'PENDING'
        }
      });
    }

    // 7. Crear cuentas divididas si se especificaron
    if (splitAccounts && splitAccounts.length > 0) {
      await Promise.all(splitAccounts.map(split => 
        prisma.splitAccount.create({
          data: {
            orderId: order.id,
            accountId: split.accountId,
            items: {
              create: split.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }))
            },
            subtotal: split.subtotal,
            status: 'PENDING'
          }
        })
      ));
    }

    res.status(201).json(orderWithSubtotals);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al crear pedido', error: error.message });
  }
};

// Obtener pedido por ID
exports.getById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        table: true,
        client: true,
        account: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        splitAccounts: {
          include: {
            account: true,
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Agregar subtotal calculado a cada item en la respuesta
    const orderWithSubtotals = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      }))
    };

    res.json(orderWithSubtotals);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedido', error: error.message });
  }
};

// Actualizar estado de pedido
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  try {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    // Obtener el pedido actual
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!currentOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Actualizar el estado del pedido
    const order = await prisma.order.update({
      where: { id },
      data: { 
        status,
        // Si el pedido se marca como READY, actualizar todos los items pendientes a READY
        ...(status === 'READY' && {
          items: {
            updateMany: {
              where: {
                status: { in: ['PENDING', 'PREPARING'] }
              },
              data: {
                status: 'READY'
              }
            }
          }
        })
      },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Actualizar estado de la mesa si es necesario
    if (order.table) {
      let newTableStatus = order.table.status;
      
      // Si el pedido está en estado DELIVERED y no hay otros pedidos activos
      if (status === 'DELIVERED') {
        const activeOrders = await prisma.order.findMany({
          where: {
            tableId: order.table.id,
            status: { not: 'DELIVERED' }
          }
        });
        
        if (activeOrders.length === 0) {
          newTableStatus = 'EN_CUENTA';
        }
      }
      
      await prisma.table.update({
        where: { id: order.table.id },
        data: { status: newTableStatus }
      });
    }

    // Emitir evento de actualización usando req.io
    if (req.io) {
      req.io.emit('orderUpdate', order);
    }

    res.json(order);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// Actualizar estado de item de pedido
exports.updateItemStatus = async (req, res) => {
  const { status } = req.body;
  const { orderId, itemId } = req.params;
  
  try {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    // Actualizar el estado del item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
      include: {
        product: true
      }
    });

    // Obtener el pedido actualizado
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Verificar si todos los items están listos
    const allItemsReady = order.items.every(item => item.status === 'READY');
    if (allItemsReady && order.status !== 'READY') {
      // Actualizar el estado del pedido a READY
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'READY' }
      });
      order.status = 'READY';
    }

    // Emitir evento de actualización usando req.io
    if (req.io) {
      req.io.emit('orderUpdate', order);
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar estado del item:', error);
    res.status(500).json({ message: 'Error al actualizar estado del item', error: error.message });
  }
};

// Agregar pago a pedido
exports.addPayment = async (req, res) => {
  const { amount, method } = req.body;
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { payments: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Calcular total pagado
    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = order.total - totalPaid;

    // Validar monto del pago
    if (amount > remaining) {
      return res.status(400).json({ message: 'El monto excede el saldo pendiente' });
    }

    // Crear pago
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount,
        method,
        status: 'COMPLETED'
      }
    });

    // Actualizar estado de pago del pedido
    const newTotalPaid = totalPaid + amount;
    const paymentStatus = newTotalPaid >= order.total ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL;

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus }
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar pago', error: error.message });
  }
};

// Dividir cuenta
exports.splitAccount = async (req, res) => {
  const { splits } = req.body;
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Validar que la suma de los splits sea igual al total
    const totalSplits = splits.reduce((sum, split) => sum + split.subtotal, 0);
    if (totalSplits !== order.total) {
      return res.status(400).json({ message: 'La suma de las divisiones debe ser igual al total' });
    }

    // Crear cuentas divididas
    const splitAccounts = await Promise.all(splits.map(split =>
      prisma.splitAccount.create({
        data: {
          orderId: order.id,
          accountId: split.accountId,
          items: {
            create: split.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          },
          subtotal: split.subtotal,
          status: 'PENDING'
        }
      })
    ));

    res.json(splitAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Error al dividir cuenta', error: error.message });
  }
};

// Obtener la orden pendiente de una mesa
exports.getPendingByTable = async (req, res) => {
  const { tableId } = req.query;
  console.log('[GET /api/orders/pending] tableId recibido:', tableId);
  if (!tableId) {
    return res.status(400).json({ message: 'Falta el parámetro tableId' });
  }
  try {
    const order = await prisma.order.findFirst({
      where: {
        tableId,
        paymentStatus: PAYMENT_STATUS.PENDING,
      },
      include: {
        table: true,
        client: true,
        account: true,
        items: { include: { product: true } },
        payments: true,
        splitAccounts: {
          include: {
            account: true,
            items: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(order || null);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar cuenta pendiente', error: error.message });
  }
};

// Actualizar los items de una orden existente
exports.updateItems = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;
  try {
    // Borra los items actuales
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    // Agrega los nuevos items
    await prisma.order.update({
      where: { id },
      data: {
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || ''
          }))
        }
      }
    });
    res.json({ message: 'Items actualizados' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar items', error: error.message });
  }
}; 