const { getConnection, closeConnection, sql } = require('./connection');

async function uploadProducts(products) {
    try {
        if (!products || products.length === 0) {
            console.log('No products to upload');
            return 0;
        }

        const pool = await getConnection();
        
        // Create a table variable to hold the bulk data
        const table = new sql.Table('Productos');
        const date = new Date();
        // Define the table structure
        table.columns.add('IdProducto', sql.NVarChar(20), { nullable: false });
        table.columns.add('Descripcion', sql.NVarChar(255), { nullable: false });
        table.columns.add('ConOferta', sql.Bit, { nullable: false });
        table.columns.add('Precio', sql.Decimal(10, 2), { nullable: false });
        table.columns.add('PrecioOriginal', sql.Decimal(10, 2), { nullable: true });
        table.columns.add('Moneda', sql.NVarChar(10), { nullable: false });
        table.columns.add('IdCategoria', sql.Int, { nullable: false });
        table.columns.add('DescripcionCategoria', sql.NVarChar(100), { nullable: false });
        table.columns.add('IdSubCategoria', sql.Int, { nullable: false });
        table.columns.add('FechaRegistro', sql.DateTime, { nullable: false });

        // Check for items with null IdProducto
        const itemsWithNullId = products.filter(item => !item.IdProducto);
        if (itemsWithNullId.length > 0) {
            console.log('❌ Found items with null IdProducto:');
            itemsWithNullId.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
            });
            console.log(`Total items with null IdProducto: ${itemsWithNullId.length}`);
        }

        // Filter out items with null IdProducto
        const validProducts = products.filter(item => item.IdProducto);
        console.log(`📊 Processing ${validProducts.length} valid products out of ${products.length} total`);

        // Add rows to the table
        validProducts.forEach(item => {
            console.log(item);
            table.rows.add(
                item.IdProducto,
                item.Descripcion,
                item.ConOferta,
                item.Precio,
                item.PrecioOriginal,
                item.Moneda,
                item.IdCategoria,
                item.DescripcionCategoria,
                item.IdSubCategoria ?? 0,
                date // FechaRegistro
            );
        });

        // Perform the bulk insert
        const request = pool.request();
        await request.bulk(table);
        
        console.log(`✅ Successfully uploaded ${products.length} products to database`);
        
        // Close the connection after successful insert
        await closeConnection();
        
        return products.length;

    } catch (error) {
        console.error('Error uploading products:', error);
        
        // Close the connection even if there's an error
        try {
            await closeConnection();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
        
        return -1;
    }
}

module.exports = { uploadProducts };