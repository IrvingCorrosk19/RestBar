const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

exports.login = async (req, res) => {
  try {
    console.log('Cuerpo recibido en login:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Faltan datos en la petición');
      return res.status(400).json({ message: 'Faltan datos' });
    }
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error('Error al buscar usuario en la base de datos:', dbError);
      return res.status(500).json({ message: 'Error en la base de datos', error: dbError.message });
    }
    if (!user || !user.active) {
      console.log('Usuario no encontrado o inactivo');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    let valid;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Error al comparar contraseñas:', bcryptError);
      return res.status(500).json({ message: 'Error al verificar contraseña', error: bcryptError.message });
    }
    if (!valid) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    let token;
    try {
      token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
    } catch (jwtError) {
      console.error('Error al firmar el token:', jwtError);
      return res.status(500).json({ message: 'Error al generar token', error: jwtError.message });
    }
    const response = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
    console.log('Respuesta enviada en login:', response);
    res.json(response);
  } catch (error) {
    console.error('Error inesperado en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}; 