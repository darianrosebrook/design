# Designer Development Start Scripts

This document describes the available start scripts for running the Designer development environment.

## Quick Start

To start both the frontend and MCP server:

```bash
# Option 1: Bash script (recommended)
pnpm run start:dev

# Option 2: Node.js script
pnpm run start:dev:node
```

## Available Scripts

### `pnpm run start:dev`
Runs the bash-based start script (`start-dev.sh`) that:
- Checks prerequisites (pnpm, node)
- Installs dependencies if needed
- Builds the MCP adapter if not already built
- Frees up commonly used ports (3000, 3001)
- Starts the MCP server in the background
- Starts the Next.js frontend
- Provides colored output and proper cleanup on exit

### `pnpm run start:dev:node`
Runs the Node.js-based start script (`start-dev.js`) that:
- Provides similar functionality to the bash script
- Uses Node.js child processes for better cross-platform compatibility
- Includes emoji indicators and colored console output
- Handles graceful shutdown with Ctrl+C

## What Gets Started

1. **Frontend (Next.js)**: Runs on `http://localhost:3000`
   - Located in `packages/design-editor`
   - Uses `pnpm run dev` command

2. **MCP Server**: Runs on stdio (for Cursor integration)
   - Located in `packages/mcp-adapter`
   - Uses `pnpm run start` command
   - Must be built before running (handled automatically)

## Prerequisites

- Node.js (latest LTS recommended)
- pnpm package manager
- All project dependencies installed (`pnpm install`)

## Troubleshooting

### Port Already in Use
The scripts automatically detect and free up ports 3000 and 3001. If you encounter port conflicts:
- The scripts will attempt to kill processes using these ports
- You can manually kill processes: `lsof -ti :3000 | xargs kill -9`

### MCP Server Not Built
If the MCP adapter isn't built, the scripts will automatically build it. You can also build manually:
```bash
cd packages/mcp-adapter
pnpm run build
```

### Dependencies Not Installed
If dependencies are missing, run:
```bash
pnpm install
```

## Stopping Services

Press `Ctrl+C` to gracefully stop all services. The scripts will:
- Send SIGTERM to all child processes
- Clean up any background processes
- Exit cleanly

## Manual Service Management

If you prefer to start services individually:

```bash
# Start MCP server only
pnpm run start:mcp

# Start frontend only (from packages/design-editor)
cd packages/design-editor
pnpm run dev

# Start both MCP and WebSocket servers
pnpm run start:servers
```

## Development Workflow

1. Run `pnpm run start:dev` from the project root
2. Open `http://localhost:3000` in your browser
3. The MCP server will be available for Cursor integration
4. Make changes to your code - both services support hot reloading
5. Press `Ctrl+C` when done to stop all services

## Script Features

- **Automatic dependency checking**: Ensures pnpm and Node.js are installed
- **Port management**: Automatically frees up commonly used ports
- **Build automation**: Builds MCP adapter if needed
- **Colored output**: Easy-to-read console output with color coding
- **Graceful shutdown**: Proper cleanup when stopping services
- **Error handling**: Clear error messages and exit codes
- **Cross-platform**: Both bash and Node.js versions available


















