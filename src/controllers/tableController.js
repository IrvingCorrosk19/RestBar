const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar todas las mesas
exports.getAll = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mesas', error });
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