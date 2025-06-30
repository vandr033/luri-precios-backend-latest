require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { obtenerCategoriasSucursalSoloCategoria, obtenerCategoriasYSubCategoriasSoloCategoria} = require('./services/test');
const { obtenerCategoriasSucursal, recolectarPrecios } = require('./services/hipermaxiScaper');
const { getConnection, closeConnection } = require('./database/connection');
const specs = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;


// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Luri Precios API Documentation'
}));

// health checkpoints --------------------------------------------------------------------------------------------------------------
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Verifica el estado general del sistema
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Sistema de precios activo."
 *                 database:
 *                   type: string
 *                   example: "Not checked"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (_, res) => {
    res.json({ 
        status: 'Sistema de precios activo.',
        database: 'Not checked',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /db-health:
 *   get:
 *     summary: Database health check
 *     description: Verifica la conexión con la base de datos
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Conexión exitosa con la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Connected"
 *                 database:
 *                   type: string
 *                   example: "hiper"
 *                 server:
 *                   type: string
 *                   example: "181.188.146.115"
 *                 currentTime:
 *                   type: string
 *                   format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error de conexión con la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Database health check endpoint - only connects when called
app.get('/db-health', async (_, res) => {
    let pool = null;
    try {
        pool = await getConnection();
        const result = await pool.request().query('SELECT GETDATE() AS currentTime');
        
        res.json({
            status: 'Connected',
            database: process.env.DB_DATABASE,
            server: process.env.DB_SERVER,
            currentTime: result.recordset[0].currentTime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('🔌 Database connection closed');
            } catch (closeError) {
                console.error('Error closing database connection:', closeError.message);
            }
        }
    }
});

// routes --------------------------------------------------------------------------------------------------------------
/**
 * @swagger
 * /obtener-categorias-sucursal:
 *   post:
 *     summary: Obtener categorías de la sucursal
 *     description: Recupera las categorías disponibles en la sucursal de Hipermaxi
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categorías obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al obtener categorías
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/obtener-categorias-sucursal', obtenerCategoriasSucursal);

/**
 * @swagger
 * /obtener-categorias-sucursal-solo-categoria:
 *   post:
 *     summary: Obtener solo categorías (sin subcategorías)
 *     description: Recupera solo las categorías principales sin sus subcategorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categorías obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al obtener categorías
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/obtener-categorias-sucursal-solo-categoria', obtenerCategoriasSucursalSoloCategoria);

/**
 * @swagger
 * /obtener-categorias-sucursal-solo-categoria-y-subcategoria:
 *   post:
 *     summary: Obtener categorías con subcategorías
 *     description: Recupera las categorías junto con sus subcategorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categorías y subcategorías obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al obtener categorías
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/obtener-categorias-sucursal-solo-categoria-y-subcategoria', obtenerCategoriasYSubCategoriasSoloCategoria);

/**
 * @swagger
 * /recolectar-precios:
 *   post:
 *     summary: Recolectar precios de productos
 *     description: Inicia el proceso de recolección de precios de productos de Hipermaxi
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Recolección de precios completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Proceso de recolección de precios completado"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCategorias:
 *                       type: integer
 *                       example: 5
 *                     categoriasExitosas:
 *                       type: integer
 *                       example: 4
 *                     categoriasConError:
 *                       type: integer
 *                       example: 1
 *                     totalProductos:
 *                       type: integer
 *                       example: 1500
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error durante la recolección de precios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/recolectar-precios', recolectarPrecios);



// server --------------------------------------------------------------------------------------------------------------
// Start server immediately without database connection test
const server = app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`💡 Database connection will be established only when needed`);
    console.log(`🔍 Use /db-health to test database connection`);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await closeConnection();
    server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await closeConnection();
    server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
    });
});