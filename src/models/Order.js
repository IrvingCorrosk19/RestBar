const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tipos de pedido
const ORDER_TYPES = {
  KITCHEN: 'KITCHEN',     // Pedido para cocina
  BAR: 'BAR',            // Pedido en barra
  TABLE: 'TABLE',        // Pedido para mesa
  PERSONAL: 'PERSONAL',   // Pedido personal
  TAKEAWAY: 'TAKEAWAY'   // Pedido para llevar
};

// Estados de pago
const PAYMENT_STATUS = {
  PENDING: 'PENDING',       // Pendiente de pago
  PARTIAL: 'PARTIAL',       // Pago parcial
  PAID: 'PAID',            // Pagado
  CANCELLED: 'CANCELLED'    // Cancelado
};

// Estados del pedido
const ORDER_STATUS = {
  PENDING: 'PENDING',       // Pendiente
  PREPARING: 'PREPARING',   // En preparación
  READY: 'READY',          // Listo
  DELIVERED: 'DELIVERED',   // Entregado
  CANCELLED: 'CANCELLED'    // Cancelado
};

// Modelo de Pedido
const Order = {
  id: String,
  type: String,            // TABLE, BAR, PERSONAL, TAKEAWAY
  status: String,          // PENDING, PREPARING, READY, DELIVERED, CANCELLED
  paymentStatus: String,   // PENDING, PARTIAL, PAID, CANCELLED
  total: Number,
  subtotal: Number,
  tax: Number,
  discount: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date,
  
  // Relaciones
  table: {                 // Si es pedido de mesa
    id: String,
    number: Number
  },
  customer: {              // Cliente asociado
    id: String,
    name: String,
    document: String
  },
  account: {               // Cuenta asociada
    id: String,
    type: String,          // INDIVIDUAL, SHARED
    status: String         // ACTIVE, CLOSED
  },
  items: [{                // Items del pedido
    product: {
      id: String,
      name: String,
      price: Number,
      category: String
    },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  payments: [{             // Pagos realizados
    id: String,
    amount: Number,
    method: String,        // CASH, CARD, TRANSFER
    status: String,        // PENDING, COMPLETED, FAILED
    createdAt: Date
  }],
  splitAccounts: [{        // Cuentas divididas
    id: String,
    account: {
      id: String,
      type: String
    },
    items: [{
      productId: String,
      quantity: Number,
      price: Number
    }],
    subtotal: Number,
    status: String
  }]
};

module.exports = {
  Order,
  ORDER_TYPES,
  PAYMENT_STATUS,
  ORDER_STATUS
}; 