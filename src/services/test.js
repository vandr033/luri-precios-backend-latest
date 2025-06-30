const axios = require('axios');
const baseUrl = process.env.baseURL;
const idMarket = process.env.IdSucursal;
const idSucursal = process.env.IdSucursal;

// Parse categories from environment variable with error handling
let categoriasFiltro = [];
try {
    if (process.env.Categorias) {
        categoriasFiltro = JSON.parse(process.env.Categorias);
    }
} catch (error) {
    console.log('Error parsing Categorias from .env file:', error.message);
    console.log('Using empty array as default');
    categoriasFiltro = [];
}

let categoriasYSubCategoriasFiltro = [];
try {
    if (process.env.CategoriasYSubCategorias) {
        categoriasYSubCategoriasFiltro = JSON.parse(process.env.CategoriasYSubCategorias);
        console.log("categoriasYSubCategoriasFiltro:", categoriasYSubCategoriasFiltro);
    }
} catch (error) {
    console.log('Error parsing CategoriasYSubCategorias from .env file:', error.message);
    console.log('Using empty array as default');
    categoriasYSubCategoriasFiltro = [];
}

//obtiene las categorias de la sucursal
async function obtenerCategoriasSucursal(req, res){
    try{
        const url = `${baseUrl}/markets/clasificaciones?IdMarket=${idMarket}&IdSucursal=${idSucursal}`;
        console.log("baseUrl:", baseUrl);
        console.log("idMarket:", idMarket);
        console.log("idSucursal:", idSucursal);
        console.log("categoriasFiltro:", categoriasFiltro);
        console.log("URL:", url);
        const response = await axios.get(url);
        mensaje = response.data;
        if(mensaje.ConError == true){
            res.status(500).json({ success: false, error: mensaje.Mensaje });
        }

        Dato = mensaje.Dato;
        console.log("Categorías obtenidas:", Dato);
        
        // Filter categories based on process.env.Categorias
        let categoriasFiltradas = [];
        
        if (categoriasFiltro.length > 0) {
            // Filter through all rubros and their categories
            Dato.forEach(rubro => {
                if (rubro.Categorias && Array.isArray(rubro.Categorias)) {
                    rubro.Categorias.forEach(categoria => {
                        if (categoriasFiltro.includes(categoria.Descripcion)) {
                            categoriasFiltradas.push({
                                IdCategoria: categoria.IdCategoria,
                                Descripcion: categoria.Descripcion,
                                SubCategorias: categoria.SubCategorias ? categoria.SubCategorias.map(sub => ({
                                    IdSubcategoria: sub.IdSubcategoria,
                                    Descripcion: sub.Descripcion
                                })) : []
                            });
                        }
                    });
                }
            });
            
            console.log("Categorías filtradas:", categoriasFiltradas);
            res.json({ success: true, data: categoriasFiltradas });
        } else {
            // If no filter is set, return all categories with simplified structure
            let todasLasCategorias = [];
            Dato.forEach(rubro => {
                if (rubro.Categorias && Array.isArray(rubro.Categorias)) {
                    rubro.Categorias.forEach(categoria => {
                        todasLasCategorias.push({
                            IdCategoria: categoria.IdCategoria,
                            Descripcion: categoria.Descripcion,
                            SubCategorias: categoria.SubCategorias ? categoria.SubCategorias.map(sub => ({
                                IdSubcategoria: sub.IdSubcategoria,
                                Descripcion: sub.Descripcion
                            })) : []
                        });
                    });
                }
            });
            res.json({ success: true, data: todasLasCategorias });
        }
        
    } catch(error){
        console.log('Error obteniendo categorías:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function obtenerCategoriasYSubCategoriasSucursal(req, res){
    try{
        const response = await axios.get(`${baseUrl}/markets/clasificaciones?IdMarket=${idMarket}&IdSucursal=${idSucursal}`);
        const mensaje = response.data;
        if(mensaje.ConError == true){
            res.status(500).json({ success: false, error: mensaje.Mensaje });
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
                        console.log("categoriaFiltro:", categoriaFiltro);
                        if(categoriaFiltro){
                            let subCategorias = [];
                            
                            console.log(`Processing category: ${categoria.Descripcion}`);
                            console.log(`Available subcategories:`, categoria.SubCategorias);
                            console.log(`Filter subcategories:`, categoriaFiltro.SubCategorias);
                            
                            if(categoria.SubCategorias && Array.isArray(categoria.SubCategorias)){
                                if(categoriaFiltro.SubCategorias.length === 0){
                                    // If SubCategorias is empty array, return all subcategories
                                    console.log(`Returning ALL subcategories for ${categoria.Descripcion}`);
                                    subCategorias = categoria.SubCategorias.map(subCat => ({
                                        idSubCategoria: subCat.IdSubcategoria,
                                        descripcion: subCat.Descripcion
                                    }));
                                } else {
                                    // Filter subcategories based on the specified ones
                                    console.log(`Filtering subcategories for ${categoria.Descripcion}`);
                                    subCategorias = categoria.SubCategorias
                                        .filter(subCat => categoriaFiltro.SubCategorias.includes(subCat.Descripcion))
                                        .map(subCat => ({
                                            idSubCategoria: subCat.IdSubcategoria,
                                            descripcion: subCat.Descripcion
                                        }));
                                }
                            }
                            
                            console.log(`Final subcategories for ${categoria.Descripcion}:`, subCategorias);
                            
                            categoriasConSubCategorias.push({
                                idCategoria: categoria.IdCategoria,
                                descripcion: categoria.Descripcion,
                                subCategorias: subCategorias
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
                                subCategorias: subCategorias
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
                            subCategorias: subCategorias
                        });
                    });
                }
            });
        }
        res.json({ success: true, data: categoriasConSubCategorias });
    } catch(error){
        console.log('Error obteniendo categorías y subcategorías:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    obtenerCategoriasSucursalSoloCategoria: obtenerCategoriasSucursal,
    obtenerCategoriasYSubCategoriasSoloCategoria: obtenerCategoriasYSubCategoriasSucursal,
}