require('dotenv').config();
const { getConnection, closeConnection, sql } = require('./database/connection');

async function testDatabaseConnection() {
    try {
        console.log('🔍 Testing database connection...');
        console.log('📋 Environment variables:');
        console.log('  DB_SERVER:', process.env.DB_SERVER);
        console.log('  DB_DATABASE:', process.env.DB_DATABASE);
        console.log('  DB_USER:', process.env.DB_USER ? '***' : 'NOT SET');
        console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
        console.log('  DB_PORT:', process.env.DB_PORT || '1433');
        
        const pool = await getConnection();
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const result = await pool.request().query('SELECT GETDATE() AS currentTime');
        console.log('⏰ Current database time:', result.recordset[0].currentTime);
        
        // Check if Productos table exists
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Productos'
        `);
        
        if (tableCheck.recordset.length > 0) {
            console.log('✅ Productos table exists');
            
            // Get table structure
            const structure = await pool.request().query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Productos'
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('📋 Table structure:');
            structure.recordset.forEach(col => {
                console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('❌ Productos table does not exist');
        }
        
        await closeConnection();
        console.log('🔌 Connection closed');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('🔧 Error details:', {
            code: error.code,
            state: error.state,
            class: error.class,
            lineNumber: error.lineNumber
        });
    }
}

// Run the test
testDatabaseConnection(); 