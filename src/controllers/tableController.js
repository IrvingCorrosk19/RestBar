const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener todas las mesas con su estado actual
exports.getAll = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        usuarioActual: {
          select: {
            id: true,
            name: true
          }
        },
        accounts: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mesas', error: error.message });
  }
};

// Crear mesa
exports.create = async (req, res) => {
  const { number, capacity, location, zoneId } = req.body;
  try {
    const table = await prisma.table.create({
      data: { number, capacity, location, zoneId, status: 'AVAILABLE', active: true },
    });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear mesa', error });
  }
};

// Editar mesa
exports.update = async (req, res) => {
  const { id } = req.params;
  const { number, capacity, location, zoneId, status, active, x, y } = req.body;
  try {
    const table = await prisma.table.update({
      where: { id },
      data: { number, capacity, location, zoneId, status, active, x, y },
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar mesa', error });
  }
};

// Desactivar mesa (soft delete)
exports.deactivate = async (req, res) => {
  const { id } = req.params;
  try {
    const table = await prisma.table.update({
      where: { id },
      data: { active: false },
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar mesa', error });
  }
};

// Ocupar una mesa
exports.occupy = async (req, res) => {
  const { tableId } = req.params;
  const { userId } = req.body;

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { accounts: true }
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    if (table.status !== 'LIBRE') {
      return res.status(400).json({ message: 'La mesa no está disponible' });
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        status: 'OCUPADA',
        horaInicio: new Date(),
        usuarioId: userId,
        cuentaAbierta: false
      }
    });

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: 'Error al ocupar mesa', error: error.message });
  }
};

// Abrir cuenta en una mesa
exports.openAccount = async (req, res) => {
  const { tableId } = req.params;

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { accounts: true }
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    if (table.status !== 'OCUPADA' || table.cuentaAbierta) {
      return res.status(400).json({ message: 'No se puede abrir cuenta en esta mesa' });
    }

    // Crear nueva cuenta
    const account = await prisma.account.create({
      data: {
        type: 'SHARED',
        status: 'ACTIVE',
        tableId: tableId
      }
    });

    // Actualizar estado de la mesa
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        status: 'EN_PEDIDO',
        cuentaAbierta: true
      }
    });

    res.json({ table: updatedTable, account });
  } catch (error) {
    res.status(500).json({ message: 'Error al abrir cuenta', error: error.message });
  }
};

// Cerrar cuenta de una mesa
exports.closeAccount = async (req, res) => {
  const { tableId } = req.params;

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        accounts: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    if (!table.cuentaAbierta) {
      return res.status(400).json({ message: 'No hay cuenta abierta en esta mesa' });
    }

    // Cerrar cuenta activa
    await prisma.account.updateMany({
      where: {
        tableId: tableId,
        status: 'ACTIVE'
      },
      data: {
        status: 'CLOSED'
      }
    });

    // Liberar mesa
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        status: 'LIBRE',
        cuentaAbierta: false,
        horaInicio: null,
        usuarioId: null
      }
    });

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar cuenta', error: error.message });
  }
};

// Actualizar estado de la mesa
exports.updateStatus = async (req, res) => {
  const { tableId } = req.params;
  const { status } = req.body;

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
}; 