const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Validar contraseña
const validatePassword = (password) => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una mayúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  return null;
};

// Listar todos los usuarios (solo admin)
exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error });
  }
};

// Crear usuario (solo admin)
exports.create = async (req, res) => {
  const { email, password, name, role } = req.body;

  // Validar campos requeridos
  if (!email || !password || !name || !role) {
    return res.status(400).json({ 
      message: 'Todos los campos son requeridos',
      details: {
        email: !email ? 'El email es requerido' : null,
        password: !password ? 'La contraseña es requerida' : null,
        name: !name ? 'El nombre es requerido' : null,
        role: !role ? 'El rol es requerido' : null
      }
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'El formato del email no es válido' });
  }

  // Validar contraseña
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  // Validar rol
  const validRoles = ['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'El rol especificado no es válido' });
  }

  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error });
  }
};

// Editar usuario (solo admin)
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, role, active } = req.body;

  // Validar campos requeridos
  if (!name || !role) {
    return res.status(400).json({ 
      message: 'Nombre y rol son requeridos',
      details: {
        name: !name ? 'El nombre es requerido' : null,
        role: !role ? 'El rol es requerido' : null
      }
    });
  }

  // Validar rol
  const validRoles = ['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR', 'CASHIER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'El rol especificado no es válido' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, role, active },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error });
  }
};

// Desactivar usuario (soft delete, solo admin)
exports.deactivate = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar usuario', error });
  }
}; 