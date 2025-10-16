# AGENTS.md - Frontend (Vite + React)

## Build/Test/Lint Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Production build to dist/
- `npm run start` - Preview production build
- `npm run lint` - ESLint with max-warnings 0 (strict mode)
- **Tests**: No test runner configured yet (consider adding Vitest)

## Code Style & Conventions

- **Imports**: ES modules only, no React import needed (new JSX transform)
- **Components**: Functional components with hooks, PascalCase naming (MyComponent.jsx)
- **Variables**: camelCase for functions/variables, avoid unnecessary blank lines in functions
- **Error Handling**: Always use try/catch with console.error and user-friendly messages
- **Async Operations**: Show loading states, handle errors gracefully
- **Types**: No TypeScript - use JSDoc comments for type hints where helpful

## Project Structure

- `src/components/` - Reusable React components
- `src/pages/` - Route page components
- `src/lib/` - Utilities
- **Styling**: TailwindCSS utilities, globals.css for base styles

## Web3 Integration

- **Blockchain**: Ethers.js v6
- **Contracts**: Dynamic loading based on chainId, error handling for missing deployments
