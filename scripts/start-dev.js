#!/usr/bin/env node

/**
 * Designer Development Start Script (Node.js version)
 * Starts both the frontend (design-editor) and MCP server concurrently
 * @author @darianrosebrook
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Print colored console output
 * @param {string} color - Color name
 * @param {string} message - Message to print
 */
function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} True if port is in use
 */
async function isPortInUse(port) {
  try {
    const { spawn } = await import('child_process');
    return new Promise((resolve) => {
      const lsof = spawn('lsof', ['-i', `:${port}`], { stdio: 'ignore' });
      lsof.on('close', (code) => resolve(code === 0));
    });
  } catch {
    return false;
  }
}

/**
 * Kill processes on a specific port
 * @param {number} port - Port number
 */
async function killPort(port) {
  try {
    const { spawn } = await import('child_process');
    const lsof = spawn('lsof', ['-ti', `:${port}`]);
    let pids = '';
    
    lsof.stdout.on('data', (data) => {
      pids += data.toString();
    });
    
    lsof.on('close', () => {
      if (pids.trim()) {
        const killProcess = spawn('kill', ['-9', ...pids.trim().split('\n')]);
        killProcess.on('close', () => {
          print('yellow', `Freed up port ${port}`);
        });
      }
    });
  } catch (error) {
    // Ignore errors - port might not be in use
  }
}

/**
 * Start a service with proper logging
 * @param {string} name - Service name
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<import('child_process').ChildProcess>} Child process
 */
function startService(name, command, args, cwd) {
  print('blue', `Starting ${name}...`);
  
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: true
  });

  // Color-code the output
  const serviceColor = name === 'Frontend' ? 'cyan' : 'magenta';
  
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        print(serviceColor, `[${name}] ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        print('red', `[${name}] ${line}`);
      }
    });
  });

  child.on('error', (error) => {
    print('red', `Failed to start ${name}: ${error.message}`);
  });

  return child;
}

/**
 * Main function
 */
async function main() {
  print('blue', '🚀 Starting Designer Development Environment');
  print('blue', '==========================================');

  // Check if we're in the right directory
  if (!existsSync('package.json') || !existsSync('packages/design-editor') || !existsSync('packages/mcp-adapter')) {
    print('red', '❌ Please run this script from the project root directory.');
    process.exit(1);
  }

  // Check if MCP adapter is built
  if (!existsSync('packages/mcp-adapter/dist')) {
    print('yellow', '⚠️  MCP adapter not built. Building now...');
    const buildProcess = spawn('pnpm', ['run', 'build'], {
      cwd: 'packages/mcp-adapter',
      stdio: 'inherit'
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          print('green', '✅ MCP adapter built successfully');
          resolve();
        } else {
          print('red', '❌ Failed to build MCP adapter');
          reject(new Error('Build failed'));
        }
      });
    });
  }

  // Free up commonly used ports
  print('blue', '🔍 Checking ports...');
  const ports = [3000, 3001];
  for (const port of ports) {
    if (await isPortInUse(port)) {
      await killPort(port);
    }
  }

  // Start services
  const services = [];

  // Start MCP server
  const mcpProcess = startService('MCP Server', 'pnpm', ['run', 'start'], 'packages/mcp-adapter');
  services.push(mcpProcess);

  // Give MCP server a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start frontend
  const frontendProcess = startService('Frontend', 'pnpm', ['run', 'dev'], 'packages/design-editor');
  services.push(frontendProcess);

  print('green', '✅ Services started successfully!');
  print('blue', '==========================================');
  print('cyan', '🌐 Frontend: http://localhost:3000');
  print('magenta', '🔧 MCP Server: Running on stdio');
  print('blue', '==========================================');
  print('yellow', '⚠️  Press Ctrl+C to stop all services');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    print('yellow', '🛑 Shutting down services...');
    services.forEach(service => {
      service.kill('SIGTERM');
    });
    process.exit(0);
  });

  // Wait for processes to exit
  await Promise.all(services.map(service => 
    new Promise(resolve => service.on('exit', resolve))
  ));
}

// Run the main function
main().catch(error => {
  print('red', `❌ Error: ${error.message}`);
  process.exit(1);
});


















