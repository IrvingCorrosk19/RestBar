const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('Headers recibidos:', req.headers); // Debug log
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader); // Debug log
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extraído:', token); // Debug log

  if (!token) {
    console.log('No se encontró token en la petición'); // Debug log
    return res.status(401).json({ message: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Error al verificar token:', err.message); // Debug log
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    console.log('Usuario autenticado:', user); // Debug log
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles }; 