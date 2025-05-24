const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar todas las reservas
exports.getAll = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { table: true, user: true },
      orderBy: { startTime: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reservas', error });
  }
};

// Crear reserva
exports.create = async (req, res) => {
  const { date, startTime, endTime, guests, notes, userId, tableId, specialRequests } = req.body;
  try {
    const reservation = await prisma.reservation.create({
      data: {
        date,
        startTime,
        endTime,
        guests,
        notes,
        userId,
        tableId,
        specialRequests,
        status: 'PENDING',
      },
    });
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear reserva', error });
  }
};

// Cancelar reserva
exports.cancel = async (req, res) => {
  const { id } = req.params;
  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar reserva', error });
  }
}; 