# Triven - AI-Powered Inventory Management Platform

**Triven** is an AI-powered inventory management platform designed to give modern businesses real-time visibility, intelligent forecasting, and effortless stock control. Built with cutting-edge technologies, Triven provides comprehensive tools for inventory optimization, sales operations, purchasing workflows, and business intelligence.

## 🚀 Overview

Triven empowers businesses with AI-driven automation, real-time analytics, and intelligent forecasting capabilities. Whether you're scaling operations or streamlining fulfillment, Triven helps you optimize inventory, reduce waste, and make confident, data-driven decisions — all in one intuitive dashboard.

## ✨ Key Features

### 📦 Intelligent Inventory Management
- **Advanced Product Catalog** - Complete product lifecycle management with SKU tracking, barcoding, and multi-dimensional attributes
- **Real-time Stock Tracking** - Live inventory levels across all locations with automated alerts
- **Smart Stock Adjustments** - Automated and manual stock corrections with full audit trails
- **Inter-site Transfers** - Seamless stock movements between warehouses and retail locations
- **Inventory Analytics** - Detailed insights into stock performance, turnover rates, and optimization opportunities

### 💰 Sales Operations
- **Customer Relationship Management** - Comprehensive customer profiles with purchase history and preferences
- **Sales Order Processing** - Streamlined order creation, tracking, and fulfillment workflows
- **Invoice Management** - Professional invoice generation with customizable templates
- **Payment Tracking** - Complete payment processing and reconciliation system
- **Sales Analytics** - Performance dashboards and revenue insights

### 🛒 Procurement & Purchasing
- **Supplier Management** - Centralized supplier database with performance tracking
- **Purchase Order Automation** - Intelligent PO creation with approval workflows
- **Receipt Management** - Digital receiving processes with quality control
- **Bill Processing** - Automated invoice matching and payment scheduling
- **Vendor Analytics** - Supplier performance metrics and cost analysis

### 🏢 Multi-Tenant Architecture
- **Agency Management** - Support for multiple business units and franchises
- **Site Operations** - Warehouse and retail location management
- **Role-Based Access Control** - Granular permissions system with custom roles
- **Team Collaboration** - Built-in communication and notification systems

### 💼 Financial Management
- **Multi-Currency Support** - Global operations with real-time currency conversion
- **Payment Processing** - Integrated payment solutions with multiple methods
- **Financial Reporting** - Comprehensive financial statements and analytics
- **Tax Management** - Automated tax calculations and compliance tracking

### 📊 Analytics & Reporting
- **Business Intelligence** - Interactive dashboards with real-time KPIs
- **Custom Reports** - Flexible reporting engine with export capabilities
- **Predictive Analytics** - AI-powered forecasting for inventory and sales
- **Performance Metrics** - Operational efficiency tracking and optimization

### 🤖 AI Assistant Features
- **Natural Language Queries** - Ask questions about your business in plain English/French
- **Demand Forecasting** - AI-powered predictions for product demand
- **Anomaly Detection** - Automatic identification of inventory irregularities
- **Smart Recommendations** - AI-generated purchase and reorder suggestions
- **Business Insights** - Intelligent analysis of KPIs and trends
- **Product Performance Analysis** - Deep dive into individual product metrics
- **Optimization Suggestions** - AI-driven recommendations for operational efficiency

## 🛠 Technology Stack

### Frontend
- **React 19** - Modern UI with advanced rendering capabilities
- **TypeScript** - Type-safe development with enhanced IDE support
- **Mantine UI** - Beautiful, accessible component library
- **React Router v7** - Advanced routing with data loading
- **Recharts** - Interactive data visualization

### Backend
- **Node.js** - High-performance server-side runtime
- **Prisma ORM** - Type-safe database operations with migrations
- **PostgreSQL** - Robust, scalable database with full-text search
- **Stripe Integration** - Secure payment processing
- **Resend** - Reliable email delivery system

### Development & Testing
- **Vite** - Lightning-fast build tool and development server
- **Vitest** - Modern testing framework with coverage
- **Testing Library** - Component and integration testing
- **TypeScript** - Static type checking

### AI & Machine Learning
- **ChromaDB** - Vector database for AI-powered features
- **Ollama** - Local AI model integration with Docker support
- **Intelligent Assistants** - AI-powered business insights
- **LLaMA 3.1** - Advanced language model for natural language queries

### Infrastructure & Deployment
- **Docker** - Containerized deployment for scalability
- **Docker Compose** - Multi-service orchestration
- **Render.com** - Production deployment platform
- **Bun** - Fast JavaScript runtime and package manager

## 📋 Prerequisites

- **Node.js** >= 20.0.0 (or **Bun** >= 1.0.0)
- **PostgreSQL** database
- **Docker** & **Docker Compose** (for containerized setup)
- **npm**, **yarn**, or **bun** package manager

## 🚀 Quick Start

### Option 1: Traditional Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd triven
```

#### 2. Install Dependencies
```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

#### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/triven"
SESSION_SECRET="your-session-secret"
STRIPE_SECRET_KEY="your-stripe-secret-key"
RESEND_API_KEY="your-resend-api-key"

# AI Assistant Configuration
OLLAMA_HOST="http://localhost:11434"

# Demo Request Configuration
SALES_TEAM_EMAILS="sales@triven.com,team@triven.com"
SEND_DEMO_CONFIRMATION="true"
```

#### 4. Database Setup
```bash
# Generate Prisma client
npm run db:gen

# Push database schema
npm run db:push

# Seed with demo data
npm run db:reset
```

#### 5. AI Setup (Optional)
Install and start Ollama locally:
```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull the required model
ollama pull llama3.1:8b
```

#### 6. Start Development Server
```bash
npm run dev
# or with bun
bun run dev
```

Visit `http://localhost:3000` to access the application.

### Option 2: Docker Setup (Recommended for Production)

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd triven
cp .env.docker .env
```

#### 2. Update Environment Variables
Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/triven"
OLLAMA_HOST="http://ollama:11434"
NODE_ENV="development"
```

#### 3. Start with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f
```

This will start:
- **Main Application** on `http://localhost:3000`
- **Ollama AI Service** on `http://localhost:11434`
- **Automatic model download** (llama3.1:8b)

#### 4. Database Setup (Docker)
```bash
# Run database migrations
docker-compose exec app bun run db:push

# Seed with demo data
docker-compose exec app bun run db:reset
```

### Option 3: Production Deployment (Render.com)

#### 1. Prepare Repository
```bash
# Ensure all Docker files are committed
git add .
git commit -m "Add Docker configuration"
git push origin main
```

#### 2. Deploy to Render
1. Connect your repository to Render.com
2. Render will automatically detect `render.yaml`
3. This creates two services:
   - **Main App** (Standard plan)
   - **Ollama AI** (Standard+ plan recommended)

#### 3. Configure Environment Variables
Set these in Render dashboard:
- `DATABASE_URL` - Your PostgreSQL connection string
- `OLLAMA_HOST` - URL of your Ollama service
- `NODE_ENV=production`
- Other environment variables as needed

#### 4. Important Notes for Production
- Ollama requires significant resources (2GB+ RAM)
- Model download takes time on first deployment
- Consider using Standard or Professional plans for AI service

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks

### Database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:gen` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:build` - Generate client and push schema
- `npm run db:reset` - Reset database with seed data

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage

### Docker Commands
- `docker-compose up --build` - Build and start all services
- `docker-compose down` - Stop all services
- `docker-compose logs -f` - View real-time logs
- `docker-compose exec app bun run db:push` - Run database migrations in container

### AI Assistant Commands
- `ollama serve` - Start Ollama service (local installation)
- `ollama pull llama3.1:8b` - Download AI model
- `ollama list` - List installed models

## 🏗 Project Structure

```
triven/
├── app/                    # Application source code
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── layouts/           # Page layouts
│   ├── modules/           # Feature modules (email, stripe)
│   ├── pages/             # Page components
│   ├── routes/            # Route handlers
│   │   └── assistant/     # AI assistant routes
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── common/            # Shared constants and helpers
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── scripts/               # Build and deployment scripts
├── docs/                  # Documentation
├── Dockerfile             # Main app container configuration
├── Dockerfile.ollama      # Ollama AI service container
├── docker-compose.yml     # Multi-service orchestration
├── render.yaml           # Render.com deployment config
└── .dockerignore         # Docker ignore patterns
```

## 🔑 Core Modules

### Inventory Management
- Product catalog with variants and attributes
- Multi-location stock tracking
- Automated reorder points and safety stock
- Barcode scanning and label printing
- Inventory valuation methods (FIFO, LIFO, Average)

### Sales Pipeline
- Lead and opportunity management
- Quote generation and approval
- Order processing and fulfillment
- Customer portal access
- Sales commission tracking

### Purchase Management
- Vendor evaluation and onboarding
- RFQ (Request for Quote) management
- Purchase requisition workflows
- Goods receipt and quality control
- Vendor performance analytics

### Financial Operations
- Chart of accounts management
- General ledger and journal entries
- Accounts payable and receivable
- Cash flow management
- Financial statement generation

## 🔐 Security Features

- **Authentication** - Secure user authentication with session management
- **Authorization** - Role-based access control with granular permissions
- **Data Encryption** - Encrypted data storage and transmission
- **Audit Trails** - Complete activity logging and compliance tracking
- **API Security** - Rate limiting and request validation

## 🌐 Multi-Tenancy

Triven supports full multi-tenancy with:
- **Company Isolation** - Complete data separation between tenants
- **Custom Branding** - White-label capabilities for each tenant
- **Scalable Architecture** - Efficient resource utilization
- **Tenant Management** - Administrative tools for SaaS providers

## 📈 Scalability

- **Horizontal Scaling** - Microservices-ready architecture
- **Database Optimization** - Efficient queries with connection pooling
- **Caching Strategy** - Redis integration for improved performance
- **CDN Support** - Global asset delivery
- **Load Balancing** - High availability deployment options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

#### Docker/Ollama Issues
- **Ollama model not downloading**: Ensure sufficient disk space (8GB+ for llama3.1:8b)
- **Container out of memory**: Increase Docker memory allocation to 8GB+
- **Port conflicts**: Ensure ports 3000 and 11434 are available
- **Model loading timeout**: First startup may take 10-15 minutes for model download

#### Development Issues
- **Database connection errors**: Verify PostgreSQL is running and connection string is correct
- **Build failures**: Clear node_modules and reinstall dependencies
- **Type errors**: Run `npm run typecheck` to identify TypeScript issues

#### AI Assistant Issues
- **"AI service unavailable"**: Check if Ollama is running (`docker-compose logs ollama`)
- **Slow responses**: AI inference requires significant CPU, consider using GPU acceleration
- **Model not found**: Verify llama3.1:8b model is downloaded (`ollama list`)

### Performance Optimization
- Use GPU acceleration for Ollama when available
- Implement Redis caching for frequent queries
- Consider using lighter AI models for development
- Monitor resource usage with `docker stats`

## 🆘 Support

For support and questions:
- **Documentation**: [docs.triven.app](https://docs.triven.app)
- **Community**: [community.triven.app](https://community.triven.app)
- **Email**: support@triven.app
- **Issues**: [GitHub Issues](https://github.com/your-org/triven/issues)

## 🔮 Roadmap

### Upcoming Features
- **Mobile Applications** - Native iOS and Android apps
- **Advanced Analytics** - Machine learning-powered insights
- **API Marketplace** - Third-party integrations hub
- **Workflow Automation** - Visual workflow builder
- **Advanced Reporting** - Custom dashboard builder

### Version History
- **v1.0.0** - Initial release with core inventory management features
- **v1.1.0** - Enhanced analytics and reporting
- **v1.2.0** - Mobile-responsive design improvements
- **v2.0.0** - AI-powered features and automation

---

**Triven** - Empowering businesses with intelligent inventory management solutions.

Built with ❤️ using modern web technologies.
