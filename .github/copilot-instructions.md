# Byline CMS Copilot Instructions

## Project Overview
Byline CMS is an open-source, AI-first headless CMS. It is a monorepo using `pnpm` and `turbo`.
**Note**: The entire project is currently a **proof of concept**.
- **Core Stack**: React 19, Vite, Fastify, PostgreSQL, Drizzle ORM, Zod, Biome.
- **Architecture**:
  - `apps/dashboard`: The main admin dashboard (Vite + React) and API server (Fastify).
  - `packages/byline`: Core CMS logic (`@byline/core`).
  - `packages/db-postgres`: PostgreSQL database adapter (`@byline/db-postgres`).
  - `packages/shared`: Shared utilities (`@byline/shared`).

## Critical Workflows

### Development
- **Start Dev Server**: `pnpm dev` (runs `turbo run dev --parallel`).
  - Starts the dashboard app (Vite) and the API server (Fastify) concurrently.
  - Dashboard runs on `http://localhost:5173`.
  - API runs on `http://localhost:3001`.
- **Database Setup**:
  1. Start Postgres: `cd postgres && ./postgres.sh up -d`
  2. Init DB: `cd packages/db-postgres/src/database && ./db_init.sh`
  3. Migrate: `pnpm drizzle:migrate` (from root or `packages/db-postgres`)
  4. Seed: `cd apps/dashboard && pnpm tsx --env-file=.env server/seed-bulk-documents.ts`

### Build & Test
- **Build**: `pnpm build` (uses Turbo to build all packages and apps).
- **Test**: `pnpm test` (uses native Node.js test runner via `tsx`).
  - Run single test file: `pnpm tsx --env-file=.env --test path/to/test.ts`
- **Lint/Format**: `pnpm lint` (uses Biome). **Do not use ESLint or Prettier.**

## Architecture & Patterns

### Frontend (`apps/dashboard`)
- **Routing**: Uses `@tanstack/react-router` with file-based routing in `src/routes`.
  - Route files export a `Route` component created with `createFileRoute`.
  - Loaders are used for data fetching.
  - Search params are validated with Zod schemas.
  - **Collection Routes**: `apps/dashboard/src/routes/collections` handles general collection routing and document retrieval (create, read, update).
- **Data Fetching**: Uses `fetch` directly in loaders or `@tanstack/react-query`.
  - API URL is typically `http://localhost:3001/api/...`.
- **State Management**: React Query for server state.
- **Styling**: Tailwind CSS v4.
- **UI Components**: `@infonomic/uikit` and local components in `src/ui`.
- **Editor**: Lexical is used for rich text editing.

### Backend & Database
- **Server**: Fastify server located in `apps/dashboard/server`.
  - **Note**: This is a prototype API server. Currently, the dashboard communicates with `@byline/core` via this API.
  - **Future Architecture**: The dashboard will eventually communicate directly with `@byline/core` and adapter packages (like `@byline/db-postgres`). This will enable local communication with the DB layer or remote communication via a DB proxy layer/adapter.
- **Database Access**:
  - Use `@byline/db-postgres` for DB operations.
  - Drizzle ORM is used for queries and schema definitions.
  - Schema definitions are in `packages/db-postgres/src/storage/schema.ts` (or similar).
- **Validation**: Zod is used extensively for runtime validation of API requests and responses.

### Collections & Data Modeling
- **Status**: The model for collections (structure, blocks, arrays, field data) is under active development and open to change.
- **Examples**: See `apps/dashboard/byline/collections` for current examples of collection definitions, documents, and models.
- **Key Questions**: How best to store and describe collection structure, blocks, arrays, and collection field data is an ongoing architectural discussion.
- **Zod Schemas**: `packages/byline/src/schemas/zod` contains experimental definitions attempting to derive types and validators from collection definitions.

### Monorepo & Packages
- **Imports**:
  - Internal packages are imported via `@byline/*` (e.g., `@byline/core`, `@byline/shared`).
  - In `apps/dashboard`, `@/` aliases to `src/`.
- **Package Structure**:
  - `packages/byline`: Primary responsibility is configuration, types, and schema definitions. Actual work is delegated to configured adapters.
  - `packages/db-*`: Database adapters.

## Coding Conventions
- **Linting**: Follow Biome rules. Run `pnpm lint` to check.
- **Types**: Use TypeScript strict mode. Prefer `interface` for object definitions.
- **Validation**: Always validate external data (API responses, URL params) using Zod.
- **File Naming**: Kebab-case for files and directories (e.g., `user-profile.tsx`).
- **React**: Use functional components and hooks. Avoid class components.

## Common Tasks
- **Adding a new route**: Create a new directory/file in `apps/dashboard/src/routes`. Define the `Route` and `component`.
- **Adding a DB migration**: Modify Drizzle schema in `packages/db-postgres`, then run `pnpm drizzle:generate`.
- **Running a script**: Use `pnpm tsx` for running TypeScript scripts directly.
