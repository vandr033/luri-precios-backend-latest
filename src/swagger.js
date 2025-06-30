const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Luri Precios Backend API',
            version: '1.0.0',
            description: 'API para recolectar y gestionar precios de productos de Hipermaxi',
            contact: {
                name: 'API Support',
                email: 'support@luri.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        IdProducto: {
                            type: 'string',
                            description: 'ID único del producto'
                        },
                        Descripcion: {
                            type: 'string',
                            description: 'Descripción del producto'
                        },
                        ConOferta: {
                            type: 'boolean',
                            description: 'Indica si el producto está en oferta'
                        },
                        Precio: {
                            type: 'number',
                            format: 'decimal',
                            description: 'Precio actual del producto'
                        },
                        PrecioOriginal: {
                            type: 'number',
                            format: 'decimal',
                            description: 'Precio original del producto (solo si está en oferta)'
                        },
                        Moneda: {
                            type: 'string',
                            description: 'Moneda del precio'
                        },
                        IdCategoria: {
                            type: 'integer',
                            description: 'ID de la categoría'
                        },
                        DescripcionCategoria: {
                            type: 'string',
                            description: 'Descripción de la categoría'
                        },
                        IdSubCategoria: {
                            type: 'integer',
                            description: 'ID de la subcategoría'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        IdCategoria: {
                            type: 'integer',
                            description: 'ID de la categoría'
                        },
                        Descripcion: {
                            type: 'string',
                            description: 'Descripción de la categoría'
                        },
                        SubCategorias: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    IdSubcategoria: {
                                        type: 'integer',
                                        description: 'ID de la subcategoría'
                                    },
                                    Descripcion: {
                                        type: 'string',
                                        description: 'Descripción de la subcategoría'
                                    }
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indica si la operación fue exitosa'
                        },
                        error: {
                            type: 'string',
                            description: 'Mensaje de error'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp del error'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/index.js', './src/services/*.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs; 