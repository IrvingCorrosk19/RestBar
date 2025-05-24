const prisma = require('../prisma');

// Obtener configuración
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    res.json(settings || {
      notifications: true,
      autoPrint: false,
      language: 'es',
      darkMode: false,
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ message: 'Error al obtener configuración' });
  }
};

// Actualizar configuración
exports.updateSettings = async (req, res) => {
  try {
    const { notifications, autoPrint, language, darkMode } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        notifications,
        autoPrint,
        language,
        darkMode,
      },
      create: {
        id: 1,
        notifications,
        autoPrint,
        language,
        darkMode,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error al actualizar configuración' });
  }
}; 