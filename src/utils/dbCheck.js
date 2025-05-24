const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
    try {
        // Verificar conexión
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos establecida correctamente');

        // Verificar si existe un usuario administrador
        const adminExists = await prisma.user.findFirst({
            where: {
                role: 'ADMIN'
            }
        });

        if (!adminExists) {
            // Crear usuario administrador
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await prisma.user.create({
                data: {
                    email: 'admin@restbar.com',
                    password: hashedPassword,
                    name: 'Administrador',
                    role: 'ADMIN',
                    active: true
                }
            });
            console.log('✅ Usuario administrador creado exitosamente');
            console.log('Email: admin@restbar.com');
            console.log('Contraseña: admin123');
        } else {
            console.log('ℹ️ El usuario administrador ya existe');
        }

    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la verificación
checkDatabaseConnection(); 