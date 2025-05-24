const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los clientes
exports.getAllClients = async (req, res) => {
  try {
    console.log('Intentando obtener clientes...'); // Debug log
    console.log('Usuario autenticado:', req.user); // Debug log

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Clientes encontrados:', clients); // Debug log
    res.json(clients);
  } catch (error) {
    console.error('Error detallado al obtener clientes:', error); // Debug log mejorado
    res.status(500).json({ 
      message: 'Error al obtener los clientes',
      error: error.message // Incluir el mensaje de error específico
    });
  }
};

// Obtener un cliente por ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error al obtener el cliente' });
  }
};

// Crear un nuevo cliente
exports.createClient = async (req, res) => {
  try {
    const { fullName, phone, email, identification, birthDate, gender, notes } = req.body;

    const client = await prisma.client.create({
      data: {
        fullName,
        phone,
        email,
        identification,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        notes
      }
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error al crear el cliente' });
  }
};

// Actualizar un cliente
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, email, identification, birthDate, gender, notes } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        fullName,
        phone,
        email,
        identification,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        notes
      }
    });

    res.json(client);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar el cliente' });
  }
};

// Eliminar un cliente
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar el cliente' });
  }
}; 