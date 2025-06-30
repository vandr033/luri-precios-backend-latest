# 🛒 Luri Precios Backend

A robust Node.js API for collecting and managing product prices from Hipermaxi stores in Bolivia. This backend service provides automated price scraping, database storage, and RESTful API endpoints for price monitoring and analysis.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)](package.json)

## ✨ Features

- 🔄 **Automated Price Collection**: Scrapes product prices from Hipermaxi API endpoints
- 📊 **Database Integration**: Stores product data in SQL Server with bulk insert capabilities
- 🏪 **Store Management**: Supports multiple store locations and categories
- 📈 **Category & Subcategory Support**: Flexible product categorization system
- 🔍 **Health Monitoring**: System and database health check endpoints
- 📚 **API Documentation**: Interactive Swagger UI documentation
- ⚡ **Performance Optimized**: Efficient bulk operations and connection pooling
- 🛡️ **Error Handling**: Comprehensive error handling and logging
- 🔧 **Configurable**: Environment-based configuration for different deployments

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- SQL Server database
- Access to Hipermaxi API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luri-precios-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3333`

## 📋 API Endpoints

### System Health
- `GET /health` - System health check
- `GET /db-health` - Database connection test

### Categories
- `POST /obtener-categorias-sucursal` - Get store categories
- `POST /obtener-categorias-sucursal-solo-categoria` - Get categories only
- `POST /obtener-categorias-sucursal-solo-categoria-y-subcategoria` - Get categories with subcategories

### Products
- `POST /recolectar-precios` - Collect product prices from Hipermaxi

### Documentation
- `GET /api-docs` - Interactive Swagger UI documentation

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=your_server_ip
DB_DATABASE=your_database_name
DB_PORT=1433

# Collection Settings
RECOLECCION_CADA_DIAS=3
CantidadProductos=10000

# Hipermaxi API Configuration
baseURL="https://hipermaxi.com/tienda-api/api/v1/"

# Store Configuration
IdCiudad=1
IdSucursal=85
IdMarket=85
IdTipoEntrega=1

# Category Filters
Categorias='["Cuidado del Hogar","Bebidas","Cuidado Personal"]'
CategoriasYSubCategorias='[{"Categoria":"Cuidado del Hogar","SubCategorias":[]},{"Categoria":"Bebidas","SubCategorias":[]},{"Categoria":"Cuidado Personal","SubCategorias":[]},{"Categoria":"Abarrotes", "SubCategorias":["Aderezos","Básicos"]}]'

# Server Configuration
Port=3333
```

## 🗄️ Database Schema

The application uses the following SQL Server table structure:

```sql
CREATE TABLE Productos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdProducto NVARCHAR(20) NOT NULL,
    Descripcion NVARCHAR(255) NOT NULL,
    ConOferta BIT NOT NULL,
    Precio DECIMAL(10, 2) NOT NULL,
    PrecioOriginal DECIMAL(10, 2) NULL,
    Moneda NVARCHAR(10) NOT NULL,
    IdCategoria INT NOT NULL,
    DescripcionCategoria NVARCHAR(100) NOT NULL,
    IdSubCategoria INT NOT NULL,
    FechaRegistro DATETIME NOT NULL DEFAULT GETDATE()
);
```

## 🛠️ Available Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Start development server with debugging
npm run dev:debug

# Run tests (not implemented yet)
npm test
```

## 📁 Project Structure

```
luri-precios-backend/
├── src/
│   ├── database/
│   │   ├── connection.js      # Database connection management
│   │   └── uploadProducts.js  # Bulk product upload functionality
│   ├── services/
│   │   ├── hipermaxiScaper.js # Main scraping service
│   │   └── test.js           # Testing and utility services
│   ├── jobs/
│   │   └── recolectorPrecios.js # Scheduled price collection jobs
│   ├── index.js              # Main Express application
│   └── swagger.js            # Swagger API documentation
├── .env                      # Environment configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🏗️ Architecture

### Core Components

- **Express Server**: RESTful API with middleware support
- **Database Layer**: SQL Server integration with connection pooling
- **Scraping Service**: Hipermaxi API integration for price collection
- **Bulk Operations**: Efficient database operations for large datasets
- **Health Monitoring**: System and database health checks
- **API Documentation**: Swagger UI for interactive documentation

### Data Flow

1. **Price Collection**: Scrapes product data from Hipermaxi API
2. **Data Processing**: Filters and transforms product information
3. **Database Storage**: Bulk inserts processed data into SQL Server
4. **API Exposure**: Provides RESTful endpoints for data access

## 🔧 Technologies Used

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Database**: SQL Server (mssql driver)
- **HTTP Client**: Axios
- **Documentation**: Swagger UI + JSDoc
- **Development**: Nodemon
- **Scheduling**: node-cron
- **Configuration**: dotenv

## 🚀 Deployment

### Production Deployment

1. **Set up environment variables** for production
2. **Install dependencies**: `npm install --production`
3. **Start the server**: `npm start`
4. **Configure reverse proxy** (nginx/Apache) if needed
5. **Set up process manager** (PM2) for production stability

### Docker Deployment (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3333
CMD ["npm", "start"]
```

## 🧪 Testing

Currently, the project doesn't include automated tests. To add testing:

1. Install testing framework: `npm install --save-dev jest supertest`
2. Create test files in `__tests__/` directory
3. Add test script to package.json
4. Run tests with `npm test`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📖 Documentation: `/api-docs` endpoint when server is running
- 🐛 Issues: Create an issue in the repository

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Basic price collection functionality
- SQL Server integration
- Swagger API documentation
- Health monitoring endpoints

---

**Built with ❤️ for price monitoring and analysis** 