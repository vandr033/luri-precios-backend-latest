require('dotenv').config();
const express = require('express');
const { obtenerCategoriasSucursalSoloCategoria, obtenerCategoriasYSubCategoriasSoloCategoria} = require('./services/test');
const { obtenerCategoriasSucursal, recolectarPrecios } = require('./services/hipermaxiScaper');
const { getConnection, closeConnection } = require('./database/connection');
const app = express();
const PORT = process.env.PORT || 3000;


// health checkpoints --------------------------------------------------------------------------------------------------------------
app.get('/health', (_, res) => {
    res.json({ 
        status: 'Sistema de precios activo.',
        database: 'Not checked',
        timestamp: new Date().toISOString()
    });
});

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
app.post('/obtener-categorias-sucursal', obtenerCategoriasSucursal);
app.post('/obtener-categorias-sucursal-solo-categoria', obtenerCategoriasSucursalSoloCategoria);
app.post('/obtener-categorias-sucursal-solo-categoria-y-subcategoria', obtenerCategoriasYSubCategoriasSoloCategoria);
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