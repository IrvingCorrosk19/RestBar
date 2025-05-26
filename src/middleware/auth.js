const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('[AUTH] Header recibido:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[AUTH] Token no proporcionado');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    // Asegurarnos de que req.io esté disponible
    if (!req.io && req.app.get('io')) {
      req.io = req.app.get('io');
    }
    next();
  } catch (error) {
    console.log('[AUTH] Token inválido:', error.message);
    return res.status(403).json({ message: 'Token inválido' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    next();
  };
}; 