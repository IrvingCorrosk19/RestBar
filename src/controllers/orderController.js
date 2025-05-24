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

// Crear pedido
exports.create = async (req, res) => {
  const {
    type,           // TABLE, BAR, PERSONAL, TAKEAWAY
    tableId,        // Opcional, solo para pedidos de mesa
    customerId,     // Opcional, para pedidos personales o para llevar
    items,
    notes,
    paymentMethod,  // CASH, CARD, TRANSFER
    splitAccounts   // Opcional, para dividir la cuenta
  } = req.body;

  try {
    // 1. Validar tipo de pedido
    if (!Object.values(ORDER_TYPES).includes(type)) {
      return res.status(400).json({ message: 'Tipo de pedido inválido' });
    }

    // 2. Validar mesa si es pedido de mesa
    if (type === ORDER_TYPES.TABLE && !tableId) {
      return res.status(400).json({ message: 'Se requiere una mesa para pedidos de mesa' });
    }

    // 3. Calcular totales
    let subtotal = 0;
    let hasKitchenItems = false;
    let hasBarItems = false;

    for (const item of items) {
      const product = await prisma.product.findUnique({ 
        where: { id: item.productId },
        include: { category: true }
      });
      
      if (!product) {
        return res.status(400).json({ message: `Producto ${item.productId} no encontrado` });
      }

      subtotal += product.price * item.quantity;
      
      // Determinar tipo de pedido basado en la categoría
      if (product.category.name.toLowerCase().includes('bebida')) {
        hasBarItems = true;
      } else {
        hasKitchenItems = true;
      }
    }

    const tax = subtotal * 0.19; // 19% IVA
    const total = subtotal + tax;

    // 4. Crear cuenta si es necesario
    let account = null;
    if (type === ORDER_TYPES.TABLE) {
      account = await prisma.account.create({
        data: {
          type: 'SHARED',
          status: 'ACTIVE',
          tableId
        }
      });
    }

    // 5. Crear el pedido
    const order = await prisma.order.create({
      data: {
        type,
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        tax,
        total,
        notes,
        tableId: type === ORDER_TYPES.TABLE ? tableId : null,
        customerId: type === ORDER_TYPES.PERSONAL || type === ORDER_TYPES.TAKEAWAY ? customerId : null,
        accountId: account?.id,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }))
        }
      },
      include: {
        table: true,
        customer: true,
        account: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

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

    res.status(201).json(order);
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
        customer: true,
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

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedido', error: error.message });
  }
};

// Actualizar estado de pedido
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  
  try {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        table: true,
        customer: true,
        account: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
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