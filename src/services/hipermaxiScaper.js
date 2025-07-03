const axios = require('axios');
require('dotenv').config();
const { openConnection } = require('../database/connection');
const { uploadProducts } = require('../database/uploadProducts');

// Provide default values to prevent undefined errors
const baseUrl = process.env.baseURL || 'https://www.hipermaxi.com';
const idMarket = process.env.IdMarket || '85';
const idSucursal = process.env.IdSucursal || '85';
const cantidadProductos = process.env.CantidadProductos || 10000;

// Parse categories from environment variable with error handling
let categoriasFiltro = [];
let subCategoriasFiltro = [];
try {
    if (process.env.Categorias) {
        categoriasFiltro = JSON.parse(process.env.Categorias);
    }
} catch (error) {
    console.log('Error parsing Categorias from .env file:', error.message);
    console.log('Using empty array as default');
    categoriasFiltro = [];
}
try {
    if (process.env.SubCategorias) {
        subCategoriasFiltro = JSON.parse(process.env.SubCategorias);
    }
} catch (error) {
    console.log('Error parsing SubCategorias from .env file:', error.message);
    console.log('Using empty array as default');
    subCategoriasFiltro = [];
}
let categoriasYSubCategoriasFiltro = [];
try {
    if (process.env.CategoriasYSubCategorias) {
        categoriasYSubCategoriasFiltro = JSON.parse(process.env.CategoriasYSubCategorias);
    }
} catch (error) {
    console.log('Error parsing CategoriasYSubCategorias from .env file:', error.message);
    console.log('Using empty array as default');
    categoriasYSubCategoriasFiltro = [];
}

//recolecta los precios de la sucursal
async function recolectarPrecios(req, res){
    try{
        const timeStart = new Date();
        console.log('Recolectando precios...');
        
        // Get categories first
        const categorias = await obtenerCategoriasYSubCategoriasSucursal();
        console.log("Categorías y subcategorías obtenidas:", categorias);
        
        if (categorias.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No se encontraron categorías para recolectar precios',
                timestamp: new Date().toISOString()
            });
        }
        
        const resultadosRecoleccion = [];
        
        for (const categoria of categorias) {
            if(categoria.allSubcategorias == true){
            try {
                console.log(`Recolectando precios para categoría: ${categoria.descripcion}`);
                const precios = await obtenerPreciosPorCategoria(categoria.idCategoria, categoria.descripcion);
                if(precios == -1){
                    throw new Error('Error obteniendo precios por categoría');
                }
                
                resultadosRecoleccion.push(precios);
                
            } catch (error) {
                console.error(`Error recolectando precios para categoría ${categoria.descripcion}:`, error.message);
                resultadosRecoleccion.push({
                    categoriaId: categoria.idCategoria,
                    categoriaNombre: categoria.descripcion,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            } else {
                for (const subCategoria of categoria.subCategorias) {
                    try {
                        console.log(`Recolectando precios para subcategoría: ${subCategoria.descripcion}`);
                        const precios = await obtenerPreciosPorSubCategoria(subCategoria.idSubCategoria, categoria.idCategoria, categoria.descripcion);
                        if(precios == -1){
                            throw new Error('Error obteniendo precios por subcategoría');
                        }
                        resultadosRecoleccion.push(precios);
                    } catch (error) {
                        console.error(`Error recolectando precios para subcategoría ${subCategoria.descripcion}:`, error.message);
                        resultadosRecoleccion.push({
                            categoriaId: categoria.idCategoria,
                            categoriaNombre: categoria.descripcion,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }
        
        const totalCategorias = categorias.length;
        const totalProductos = resultadosRecoleccion.reduce((acc, curr) => acc + curr.length, 0);
        const categoriasExitosas = resultadosRecoleccion.filter(r => !r.error).length;
        const categoriasConError = totalCategorias - categoriasExitosas;
        const timeEnd = new Date();
        const timeDiff = timeEnd - timeStart;
        console.log(`Tiempo de ejecución: ${timeDiff} milisegundos`);
        
        //resultadosRecoleccion is an array of arrays, each array contains the products of a category, we need to flatten it
        const productos = resultadosRecoleccion.flat();
        //upload products to database
        const resultUpload = await uploadProducts(productos);
        if(resultUpload == -1){
            throw new Error('Error uploading products to database');
        }
        res.json({ 
            success: true, 
            message: 'Proceso de recolección de precios completado',
            summary: {
                totalCategorias,
                categoriasExitosas,
                categoriasConError,
                totalProductos
            },
            //  data: productos,
            timestamp: new Date().toISOString()
        });
        
    } catch(error){
        console.error('Error recolectando precios:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

//obtener categorias y subcategorias de la sucursal
async function obtenerCategoriasYSubCategoriasSucursal(){
    try{
        const response = await axios.get(`${baseUrl}markets/clasificaciones?IdMarket=${idMarket}&IdSucursal=${idSucursal}`);
        const mensaje = response.data;
        
        if(mensaje.ConError == true){
            return [];
        }
        
        const Dato = mensaje.Dato;
        console.log("Categorías y subcategorías obtenidas:", Dato);
        
        let categoriasConSubCategorias = [];
        
        // Check if we have specific categories and subcategories filter
        if(categoriasYSubCategoriasFiltro.length > 0){
            Dato.forEach(rubro => {
                if(rubro.Categorias && Array.isArray(rubro.Categorias)){
                    rubro.Categorias.forEach(categoria => {
                        // Find if this category is in our filter
                        const categoriaFiltro = categoriasYSubCategoriasFiltro.find(cat => cat.Categoria === categoria.Descripcion);
                        
                        if(categoriaFiltro){
                            let subCategorias = [];
                            let allSubcategorias = false;
                            
                            if(categoria.SubCategorias && Array.isArray(categoria.SubCategorias)){
                                if(categoriaFiltro.SubCategorias.length === 0){
                                    // If SubCategorias is empty array, return all subcategories
                                    subCategorias = categoria.SubCategorias.map(subCat => ({
                                        idSubCategoria: subCat.IdSubcategoria,
                                        descripcion: subCat.Descripcion
                                    }));
                                    allSubcategorias = true;
                                } else {
                                    // Filter subcategories based on the specified ones
                                    subCategorias = categoria.SubCategorias
                                        .filter(subCat => categoriaFiltro.SubCategorias.includes(subCat.Descripcion))
                                        .map(subCat => ({
                                            idSubCategoria: subCat.IdSubcategoria,
                                            descripcion: subCat.Descripcion
                                        }));
                                    allSubcategorias = false;
                                }
                            }
                            
                            categoriasConSubCategorias.push({
                                idCategoria: categoria.IdCategoria,
                                descripcion: categoria.Descripcion,
                                subCategorias: subCategorias,
                                allSubcategorias: allSubcategorias
                            });
                        }
                    });
                }
            });
        } else if(categoriasFiltro.length > 0){
            // Fallback to simple category filtering if no specific subcategory filter
            Dato.forEach(rubro => {
                if(rubro.Categorias && Array.isArray(rubro.Categorias)){
                    rubro.Categorias.forEach(categoria => {
                        if(categoriasFiltro.includes(categoria.Descripcion)){
                            const subCategorias = categoria.SubCategorias ? categoria.SubCategorias.map(subCat => ({
                                idSubCategoria: subCat.IdSubcategoria,
                                descripcion: subCat.Descripcion
                            })) : [];
                            
                            categoriasConSubCategorias.push({
                                idCategoria: categoria.IdCategoria,
                                descripcion: categoria.Descripcion,
                                subCategorias: subCategorias,
                                allSubcategorias: true
                            });
                        }
                    });
                }
            });
        } else {
            // If no filter specified, return all categories
            Dato.forEach(rubro => {
                if(rubro.Categorias && Array.isArray(rubro.Categorias)){
                    rubro.Categorias.forEach(categoria => {
                        const subCategorias = categoria.SubCategorias ? categoria.SubCategorias.map(subCat => ({
                            idSubCategoria: subCat.IdSubcategoria,
                            descripcion: subCat.Descripcion
                        })) : [];
                        
                        categoriasConSubCategorias.push({
                            idCategoria: categoria.IdCategoria,
                            descripcion: categoria.Descripcion,
                            subCategorias: subCategorias,
                            allSubcategorias: true
                        });
                    });
                }
            });
        }
        
        return categoriasConSubCategorias;
    } catch(error){
        console.log('Error obteniendo categorías y subcategorías:', error.message);
        return [];
    }
}

async function obtenerCategoriasSucursal(){
    try{
        const response = await axios.get(`${baseUrl}/markets/clasificaciones?IdMarket=${idMarket}&IdSucursal=${idSucursal}`);
        mensaje = response.data;
        if(mensaje.ConError == true){
            return [];
        }
        Dato = mensaje.Dato;
        console.log("Categorías obtenidas:", Dato);
        let categoriasFiltradas = [];
        //filter categories based on process.env.Categorias only return CategoriaId and Descripcion
        if(categoriasFiltro.length > 0){
        Dato.forEach(rubro => {
            if(rubro.Categorias && Array.isArray(rubro.Categorias)){
                rubro.Categorias.forEach(categoria => {
                    if(categoriasFiltro.includes(categoria.Descripcion)){
                        categoriasFiltradas.push({
                            IdCategoria: categoria.IdCategoria,
                            Descripcion: categoria.Descripcion
                        });
                    }
                });
            }
        });
        }
        return categoriasFiltradas;
    } catch(error){
        console.log('Error obteniendo categorías:', error.message);
        return [];
    }
}

async function obtenerPreciosPorCategoria(categoriaId, descripcionCategoria){
    try{
        const timeStart = new Date();
        let precios = [];
        const response = await axios.get(`${baseUrl}public/productos?IdMarket=${idMarket}&IdLocatario=${idSucursal}&IdCategoria=${categoriaId}&Pagina=1&Cantidad=${cantidadProductos}`);
        mensaje = response.data;
        Dato = mensaje.Dato;
        if(mensaje.ConError == true){
            return -1;
        }
        Dato.forEach(producto=>{
            precios.push({
                IdProducto: producto.IdProducto,
                Descripcion: producto.Descripcion,
                ConOferta: producto.ConOferta,
                PrecioOriginal: producto.ConOferta ? producto.PrecioOferta : producto.PrecioVenta,
                Precio: producto.ConOferta ? producto.PrecioOriginal : null,
                Moneda: producto.Moneda,
                IdCategoria: categoriaId,
                DescripcionCategoria: descripcionCategoria
            })
        })
        return precios;

    }catch(error){
        console.log('Error obteniendo precios por categoría:', error.message);
        return -1;
    }
}

async function obtenerPreciosPorSubCategoria(subCategoriaId, categoriaId, descripcionCategoria){
    const timeStart = new Date();
    let precios = [];
    const response = await axios.get(`${baseUrl}public/productos?IdMarket=${idMarket}&IdLocatario=${idSucursal}&IdCategoria=${categoriaId}&IdsSubcategoria[0]=${subCategoriaId}&Pagina=1&Cantidad=${cantidadProductos}`);
    mensaje = response.data;
    Dato = mensaje.Dato;
    if(mensaje.ConError == true){
        return -1;
    }
    Dato.forEach(producto=>{
        precios.push({
            IdProducto: producto.IdProducto,
            Descripcion: producto.Descripcion,
            ConOferta: producto.ConOferta,
            PrecioOriginal: producto.ConOferta ? producto.PrecioOferta : producto.PrecioVenta,
            Precio: producto.ConOferta ? producto.PrecioOriginal : null,
            Moneda: producto.Moneda,
            IdCategoria: categoriaId,
            DescripcionCategoria: descripcionCategoria,
            IdSubCategoria: subCategoriaId
        })
    })
    return precios;
}

module.exports = {
    obtenerCategoriasSucursal,
    obtenerCategoriasYSubCategoriasSucursal,
    recolectarPrecios,
    obtenerPreciosPorSubCategoria
}