# Elektra - Price Comparison Platform

A modern price comparison web application built with Nuxt 4, Vue 3, and Vuetify. Compare product prices across multiple stores with support for multiple languages and progressive web app capabilities.

## Features

- **Multi-store Price Comparison**: Compare prices from multiple stores (Store A, Store B, Store C)
- **Product Catalog**: Browse products by categories and subcategories
- **User Authentication**: Secure authentication with JWT tokens and bcrypt password hashing
- **Favorites System**: Save and manage favorite products
- **Multi-language Support**: Available in English, Russian, and Latvian
- **Progressive Web App (PWA)**: Installable as a desktop/mobile app with offline support
- **Responsive Design**: Mobile-first UI built with Vuetify 4
- **Product Carousel**: Auto-scrolling carousel showcasing random products
- **Search Functionality**: Advanced search across products and categories

## Tech Stack

### Frontend
- **Framework**: Nuxt 4 / Vue 3
- **UI Library**: Vuetify 4
- **Build Tool**: Vite
- **Internationalization**: @nuxtjs/i18n
- **PWA**: @vite-pwa/nuxt
- **Styling**: Sass

### Backend
- **API**: Nuxt 4 Server API
- **Runtime**: Node.js
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Configuration**: dotenv

### Databases
- **SQLite**: better-sqlite3 for local data storage (`.data/app.sqlite`)
- **MongoDB**: User management, sessions, and authentication (default DB: `elektra_db`)

## Project Structure

```
elektra_nuxt3/
├── backend/
│   └── server/
│       ├── api/              # API routes
│       │   ├── admin/        # Admin endpoints
│       │   ├── auth/         # Authentication endpoints
│       │   ├── catalog/      # Product catalog endpoints
│       │   ├── favorites/    # User favorites endpoints
│       │   ├── prices/       # Price comparison endpoints
│       │   ├── products/     # Product management endpoints
│       │   └── stores/       # Store data endpoints
│       ├── plugins/          # Server plugins
│       └── utils/            # Server utilities
├── frontend/
│   ├── app/
│   │   ├── pages/           # Page components
│   │   └── app.vue          # Root component
│   ├── composables/         # Vue composables
│   ├── i18n/                # Internationalization files
│   ├── plugins/             # Client plugins
│   ├── public/              # Static assets
│   ├── .env                 # Environment variables
│   ├── .env.example         # Environment variables template
│   └── nuxt.config.ts       # Nuxt configuration
├── package.json             # Root package.json
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm, pnpm, yarn, or bun

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd elektra_nuxt3
```

2. Install dependencies:
```bash
# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install

# Using bun
bun install
```

3. Configure environment variables:
```bash
cd frontend
cp .env.example .env
```

Edit the `.env` file with your MongoDB credentials:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.u2bjp7y.mongodb.net/
MONGODB_DB=elektra_db
```

## Development

Start the development server:

```bash
# From root directory
npm run dev

# Or from frontend directory
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

Build the application:

```bash
# From root directory
npm run build

# Or from frontend directory
cd frontend
npm run build
```

Preview the production build:

```bash
# From root directory
npm run preview

# Or from frontend directory
cd frontend
npm run preview
```

## API Routes

The backend API routes are accessible via `/api/...` from the frontend:

- `/api/auth/*` - Authentication (login, register, logout)
- `/api/admin/*` - Admin management
- `/api/catalog/*` - Product catalog and categories
- `/api/favorites/*` - User favorites
- `/api/prices/*` - Price comparisons
- `/api/products/*` - Product details and search
- `/api/stores/*` - Store information

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `MONGODB_DB` | MongoDB database name | `elektra_db` |
| `NUXT_PUBLIC_SITE_URL` | Public site URL | `http://localhost:3000` |

## Deployment

For deployment information, refer to the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment).

### Render Deployment
The project includes a render-build script for Render.com:
```bash
npm run render-build
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private. All rights reserved.

## Support

For support and questions, please contact the project maintainers.
