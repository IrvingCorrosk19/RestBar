# RestBar - Sistema de Gestión para Restaurante y Bar

Sistema moderno y eficiente para la gestión de restaurantes y bares, con características innovadoras y una interfaz intuitiva.

## Características Principales

- 🍽️ Gestión de pedidos en tiempo real
- 📊 Dashboard con estadísticas
- 👥 Gestión de empleados y roles
- 📱 Interfaz responsive
- 🧾 Sistema de facturación
- 📦 Control de inventario
- 🎯 Gestión de mesas y reservas
- 🔔 Sistema de notificaciones

## Tecnologías Utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Socket.io
- JWT para autenticación

### Frontend (Próximamente)
- Next.js
- Tailwind CSS
- Shadcn/ui
- Socket.io Client

## Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/restbar.git
cd restbar
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Copiar `.env.example` a `.env`
- Configurar las variables necesarias

4. Inicializar la base de datos:
```bash
npx prisma migrate dev
```

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
restbar/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── index.js
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee las guías de contribución antes de enviar un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. 

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restbar"

# JWT Configuration
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Frontend URL
FRONTEND_URL="http://localhost:3000" 