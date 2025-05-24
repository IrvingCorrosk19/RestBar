const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar todos los productos
exports.getAll = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
};

// Crear producto
exports.create = async (req, res) => {
  const { name, description, price, stock, image, categoryId } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, description, price, stock, image, categoryId, active: true },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error });
  }
};

// Editar producto
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image, categoryId, active } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, stock, image, categoryId, active },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error });
  }
};

// Desactivar producto (soft delete)
exports.deactivate = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar producto', error });
  }
}; 