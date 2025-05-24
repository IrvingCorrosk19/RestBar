const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar todas las categorías
exports.getAll = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
};

// Crear categoría
exports.create = async (req, res) => {
  const { name, description, image } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, description, image, active: true },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría', error });
  }
};

// Editar categoría
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description, image, active } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, description, image, active },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar categoría', error });
  }
};

// Desactivar categoría (soft delete)
exports.deactivate = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { active: false },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar categoría', error });
  }
}; 