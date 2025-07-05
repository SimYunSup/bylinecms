# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Byline CMS is a developer-friendly, AI-first headless CMS built as a monorepo using Turborepo. It aims to be a fast, extensible, plugin-based framework with a "thin" field API over Drizzle ORM.

## Architecture

### Monorepo Structure
- **apps/**: Main applications
  - `api/`: Fastify-based API server with Drizzle ORM and PostgreSQL
  - `dashboard/`: React-based admin dashboard (Vite + TypeScript)
- **packages/**: Shared libraries
  - `byline/`: Core CMS logic, collections, and schema generation
  - `shared/`: Shared utilities and crypto functions
  - `uikit/`: Component library with CSS modules and Storybook

### Key Technologies
- **Build System**: Turborepo with pnpm workspaces
- **Database**: PostgreSQL with Drizzle ORM
- **API**: Fastify server with CORS support
- **Frontend**: React with Vite, TypeScript, and CSS modules
- **Validation**: Zod schemas with dynamic generation
- **Code Quality**: Biome for formatting and linting

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup database (requires PostgreSQL running)
cd postgres && mkdir data && ./postgres.sh up
cd apps/api && cp .env.example .env
cd database && ./db_init

# Generate schemas and types
pnpm byline:generate
pnpm build
pnpm drizzle:generate
pnpm drizzle:migrate
```

### Development
```bash
# Start all services in parallel
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

### Database Operations
```bash
# Initialize database
pnpm db:init

# Generate Drizzle migrations
pnpm drizzle:generate

# Run migrations
pnpm drizzle:migrate

# Generate Byline schemas
pnpm byline:generate
```

## Core Concepts

### Collections
Collections are defined in `packages/byline/src/collections/` and registered in `registry.ts`. Each collection defines:
- Field configurations
- Validation schemas
- Database table structure

### Schema Generation
- Zod schemas are dynamically generated from collection definitions
- Drizzle schemas are generated for database tables
- Both are cached for performance

### Field API
The field system supports:
- Text, select, checkbox, datetime, and rich text fields
- Validation through Zod schemas
- Form rendering with React components

### API Structure
The API follows RESTful conventions:
- `GET /api/:collection` - List records
- `POST /api/:collection` - Create record
- `GET /api/:collection/:id` - Get record
- `PUT /api/:collection/:id` - Update record
- `DELETE /api/:collection/:id` - Delete record

## Code Style

### Formatting
- Uses Biome for consistent formatting
- 2-space indentation
- Line width: 100 characters
- Single quotes for JavaScript, double quotes for JSX

### TypeScript
- Strict type checking enabled
- Prefer explicit types over inference where helpful
- Use proper type definitions in `@types/` directories

### CSS
- CSS modules for component styling
- Utility classes available in uikit
- Font variables and theme tokens defined

## Database

### PostgreSQL Setup
- Default development database: `byline_dev`
- Connection string in `.env` file
- Docker setup available in `postgres/` directory

### Schema Management
- Drizzle handles migrations
- Schema files in `apps/api/database/schema/`
- Generated schemas in `packages/byline/src/output/drizzle-schemas/`

## Testing

Run tests with `pnpm test`. The project uses the standard testing setup for each package.

## Storybook

UI components are documented in Storybook:
```bash
cd packages/uikit && pnpm storybook
```

## Important Notes

- The current API implementation is a prototype ("weekend hack")
- Database initialization script has safety protections for the development database name
- The project uses AGPL 3.0 license
- Rich text editing uses Lexical editor
- The system is designed for extensibility and plugin architecture