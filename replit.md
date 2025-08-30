# Overview

This is a full-stack bookmark and workspace manager web application inspired by Toby, built as a modern alternative to browser bookmark management. The application provides an intuitive interface for organizing, searching, and managing bookmarks with features like collections, tagging, pinning, and rich preview cards. It combines a React frontend with an Express.js backend and includes comprehensive theming support with custom design tokens.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and follows modern React patterns with functional components and hooks. The UI layer uses shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible component library. Styling is handled through Tailwind CSS with custom CSS variables for theming support.

**Key Frontend Decisions:**
- **React Router Alternative**: Uses Wouter for lightweight client-side routing instead of React Router to reduce bundle size
- **State Management**: Implements React Query (TanStack Query) for server state management and caching, avoiding the complexity of Redux or Zustand for this use case
- **Component Architecture**: Leverages compound component patterns with Radix UI primitives for complex components like dropdowns, dialogs, and context menus
- **Form Handling**: Uses React Hook Form with Zod validation for type-safe form handling and validation

## Backend Architecture
The server is built with Express.js using TypeScript and follows a RESTful API design. The architecture separates concerns with dedicated route handlers, storage abstraction, and middleware for request logging and error handling.

**Key Backend Decisions:**
- **Storage Abstraction**: Implements an interface-based storage layer that currently uses in-memory storage for demo purposes but can be easily swapped for database implementations
- **Database Schema**: Designed for PostgreSQL with Drizzle ORM, providing type-safe database operations and schema migrations
- **API Design**: RESTful endpoints following conventional HTTP methods and status codes for predictable API behavior
- **Development Setup**: Uses Vite in middleware mode for hot module replacement during development

## Data Storage Solutions
The application is designed with PostgreSQL as the primary database using Drizzle ORM for type-safe database operations. The current implementation includes a memory-based storage layer for demo purposes.

**Database Schema Design:**
- **Users Table**: Stores user credentials and profile information with unique constraints on username and email
- **Collections Table**: Organizes bookmarks into named groups with user ownership and ordering support
- **Bookmarks Table**: Central entity storing bookmark data including URL, metadata, tags, and relationships to users and collections
- **Referential Integrity**: Proper foreign key constraints with cascade deletion for data consistency

## Authentication and Authorization
While authentication infrastructure is prepared (NextAuth.js configuration exists), the current implementation uses a demo user approach for simplified development and testing.

**Planned Authentication Features:**
- Session-based authentication with secure cookie storage
- OAuth integration for Google and GitHub providers
- Credential-based authentication with password hashing
- User profile management and preferences

## External Dependencies

### UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives for consistent, accessible components
- **Tailwind CSS**: Utility-first CSS framework with custom CSS variables for dynamic theming
- **Radix UI**: Low-level UI primitives providing accessibility and keyboard navigation
- **class-variance-authority**: Type-safe variant API for component styling
- **Lucide React**: Icon library providing consistent iconography

### Database and ORM
- **Drizzle ORM**: Type-safe ORM with excellent TypeScript support and migration handling
- **Neon Database**: Serverless PostgreSQL provider for scalable database hosting
- **Drizzle Kit**: CLI tool for database schema management and migrations

### Development and Build Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Static type checking for improved developer experience and code reliability
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for forms and API data
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod validation

### Utility Libraries
- **date-fns**: Modern date utility library for date formatting and manipulation
- **clsx**: Utility for constructing className strings conditionally
- **nanoid**: URL-safe unique ID generator for client-side ID generation