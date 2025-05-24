const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Crear roles de usuario
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restbar.com' },
    update: {},
    create: {
      email: 'admin@restbar.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Administrador',
      role: 'ADMIN',
      staffProfile: {
        create: {
          department: 'MANAGEMENT'
        }
      }
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@restbar.com' },
    update: {},
    create: {
      email: 'manager@restbar.com',
      password: await bcrypt.hash('manager123', 10),
      name: 'Gerente',
      role: 'MANAGER',
      staffProfile: {
        create: {
          department: 'MANAGEMENT'
        }
      }
    }
  });

  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restbar.com' },
    update: {},
    create: {
      email: 'waiter@restbar.com',
      password: await bcrypt.hash('waiter123', 10),
      name: 'Mesero',
      role: 'WAITER',
      staffProfile: {
        create: {
          department: 'SERVICE'
        }
      }
    }
  });

  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@restbar.com' },
    update: {},
    create: {
      email: 'kitchen@restbar.com',
      password: await bcrypt.hash('kitchen123', 10),
      name: 'Cocinero',
      role: 'KITCHEN',
      staffProfile: {
        create: {
          department: 'KITCHEN'
        }
      }
    }
  });

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Entradas',
        description: 'Platos para comenzar',
        active: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Platos Principales',
        description: 'Platos fuertes',
        active: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Postres',
        description: 'Dulces y postres',
        active: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas',
        description: 'Bebidas y refrescos',
        active: true
      }
    })
  ]);

  // Crear productos
  const products = await Promise.all([
    // Entradas
    prisma.product.create({
      data: {
        name: 'Ensalada César',
        description: 'Lechuga romana, crutones, parmesano y aderezo césar',
        price: 8.99,
        stock: 50,
        active: true,
        categoryId: categories[0].id,
        preparationTime: 10,
        cost: 3.50,
        profitMargin: 0.61
      }
    }),
    prisma.product.create({
      data: {
        name: 'Carpaccio',
        description: 'Finas láminas de res con aceite de oliva y parmesano',
        price: 12.99,
        stock: 30,
        active: true,
        categoryId: categories[0].id,
        preparationTime: 15,
        cost: 5.00,
        profitMargin: 0.62
      }
    }),
    // Platos Principales
    prisma.product.create({
      data: {
        name: 'Filete Mignon',
        description: 'Filete de res a la parrilla con salsa de vino tinto',
        price: 24.99,
        stock: 20,
        active: true,
        categoryId: categories[1].id,
        preparationTime: 25,
        cost: 12.00,
        profitMargin: 0.52
      }
    }),
    prisma.product.create({
      data: {
        name: 'Pasta Carbonara',
        description: 'Pasta con salsa cremosa, panceta y parmesano',
        price: 16.99,
        stock: 40,
        active: true,
        categoryId: categories[1].id,
        preparationTime: 20,
        cost: 6.00,
        profitMargin: 0.65
      }
    }),
    // Postres
    prisma.product.create({
      data: {
        name: 'Tiramisú',
        description: 'Postre italiano con café y mascarpone',
        price: 7.99,
        stock: 25,
        active: true,
        categoryId: categories[2].id,
        preparationTime: 5,
        cost: 2.50,
        profitMargin: 0.69
      }
    }),
    // Bebidas
    prisma.product.create({
      data: {
        name: 'Limonada',
        description: 'Limonada natural con menta',
        price: 4.99,
        stock: 100,
        active: true,
        categoryId: categories[3].id,
        preparationTime: 5,
        cost: 1.00,
        profitMargin: 0.80
      }
    })
  ]);

  // Crear zonas
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        name: 'Terraza',
        description: 'Área exterior con vista al jardín'
      }
    }),
    prisma.zone.create({
      data: {
        name: 'Salón Principal',
        description: 'Área interior principal'
      }
    }),
    prisma.zone.create({
      data: {
        name: 'Bar',
        description: 'Área de bar con mesas altas'
      }
    })
  ]);

  // Crear mesas
  const tables = await Promise.all([
    // Mesas en Terraza
    prisma.table.create({
      data: {
        number: 1,
        capacity: 4,
        status: 'AVAILABLE',
        location: 'Terraza',
        active: true,
        zoneId: zones[0].id,
        x: 100,
        y: 100
      }
    }),
    prisma.table.create({
      data: {
        number: 2,
        capacity: 2,
        status: 'AVAILABLE',
        location: 'Terraza',
        active: true,
        zoneId: zones[0].id,
        x: 200,
        y: 100
      }
    }),
    // Mesas en Salón Principal
    prisma.table.create({
      data: {
        number: 3,
        capacity: 6,
        status: 'AVAILABLE',
        location: 'Salón Principal',
        active: true,
        zoneId: zones[1].id,
        x: 100,
        y: 200
      }
    }),
    prisma.table.create({
      data: {
        number: 4,
        capacity: 4,
        status: 'AVAILABLE',
        location: 'Salón Principal',
        active: true,
        zoneId: zones[1].id,
        x: 200,
        y: 200
      }
    }),
    // Mesas en Bar
    prisma.table.create({
      data: {
        number: 5,
        capacity: 2,
        status: 'AVAILABLE',
        location: 'Bar',
        active: true,
        zoneId: zones[2].id,
        x: 100,
        y: 300
      }
    })
  ]);

  // Crear algunos pedidos de ejemplo
  const order1 = await prisma.order.create({
    data: {
      status: 'COMPLETED',
      total: 33.97,
      type: 'KITCHEN',
      userId: waiter.id,
      tableId: tables[0].id,
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      items: {
        create: [
          {
            quantity: 1,
            price: 8.99,
            status: 'COMPLETED',
            productId: products[0].id
          },
          {
            quantity: 1,
            price: 24.99,
            status: 'COMPLETED',
            productId: products[2].id
          }
        ]
      }
    }
  });

  const order2 = await prisma.order.create({
    data: {
      status: 'PREPARING',
      total: 20.98,
      type: 'KITCHEN',
      userId: waiter.id,
      tableId: tables[1].id,
      items: {
        create: [
          {
            quantity: 1,
            price: 12.99,
            status: 'PREPARING',
            productId: products[1].id
          },
          {
            quantity: 1,
            price: 7.99,
            status: 'PENDING',
            productId: products[4].id
          }
        ]
      }
    }
  });

  // Crear algunas reservas de ejemplo
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await prisma.reservation.create({
    data: {
      date: tomorrow,
      startTime: new Date(tomorrow.setHours(19, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(21, 0, 0, 0)),
      status: 'CONFIRMED',
      guests: 4,
      userId: waiter.id,
      tableId: tables[2].id,
      notes: 'Mesa para celebración de cumpleaños'
    }
  });

  // Crear inventario inicial
  await Promise.all(products.map(product => 
    prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: product.stock,
        type: 'INITIAL',
        alertThreshold: Math.floor(product.stock * 0.2)
      }
    })
  ));

  console.log('Datos de prueba cargados exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 