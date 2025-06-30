require('dotenv').config();
const sql = require('mssql');

const config = {
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   server: process.env.DB_SERVER,
   database: process.env.DB_DATABASE,
   port: parseInt(process.env.DB_PORT) || 1433,
   options: {
       encrypt: false,
       trustServerCertificate: true,
       enableArithAbort: true,
       requestTimeout: 30000,
       connectionTimeout: 30000,
   },
   pool: {
       max: 5,           // Reduced for free tier
       min: 0,           // Start with 0 connections
       idleTimeoutMillis: 30000,
       acquireTimeoutMillis: 30000,
       createTimeoutMillis: 30000,
       destroyTimeoutMillis: 5000,
       reapIntervalMillis: 1000,
       createRetryIntervalMillis: 200
   }
};

let pool = null;
let connectionPromise = null;

// Lazy connection - only connect when actually needed
async function getConnection() {
    if (pool) {
        return pool;
    }
    
    if (connectionPromise) {
        return connectionPromise;
    }
    
    connectionPromise = new sql.ConnectionPool(config).connect().then(poolInstance => {
        console.log('✅ Connected to SQL Server:', process.env.DB_SERVER);
        console.log('📊 Database:', process.env.DB_DATABASE);
        pool = poolInstance;
        
        // Handle pool errors
        pool.on('error', err => {
            console.error('❌ Database pool error:', err.message);
            pool = null;
            connectionPromise = null;
        });
        
        return pool;
    }).catch(err => {
        console.error('❌ Error connecting to SQL Server:', err.message);
        console.error('🔧 Check your .env file and network connection');
        pool = null;
        connectionPromise = null;
        throw err;
    });
    
    return connectionPromise;
}

// Close the connection and reset state
async function closeConnection() {
    if (pool) {
        try {
            await pool.close();
            console.log('🔌 Database connection closed');
            pool = null;
            connectionPromise = null;
        } catch (error) {
            console.error('❌ Error closing database connection:', error.message);
            throw error;
        }
    }
}

// Create a function that returns a promise for backward compatibility
function getPoolPromise() {
    return getConnection();
}

module.exports = {
    sql, 
    getConnection,
    closeConnection,
    getPoolPromise,
    getPool: () => pool
};
