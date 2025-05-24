const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar notificaciones del usuario autenticado
exports.getAll = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones', error });
  }
};

// Crear notificación (puede ser llamada desde otros módulos)
exports.create = async (req, res) => {
  const { userId, type, title, message, priority } = req.body;
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, priority },
    });
    // Emitir notificación en tiempo real
    if (req.io) req.io.emit('notification:new', notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear notificación', error });
  }
};

// Marcar notificación como leída
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación como leída', error });
  }
}; 