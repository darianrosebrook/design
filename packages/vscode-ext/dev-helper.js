#!/usr/bin/env node

/**
 * @fileoverview Development helper script for VS Code extension
 * @author @darianrosebrook
 *
 * Provides better error reporting and development workflow guidance.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function runCommand(command, silent = false) {
  try {
    if (!silent) {
      log(`Running: ${command}`, BLUE);
    }
    return execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
    });
  } catch (error) {
    if (silent) {
      return error.stdout || error.stderr || "";
    }
    throw error;
  }
}

function countErrors(output) {
  const lines = output.split("\n");
  let errorCount = 0;
  let warningCount = 0;

  for (const line of lines) {
    if (line.includes("error TS")) {
      errorCount++;
    } else if (line.includes("warning")) {
      warningCount++;
    }
  }

  return { errorCount, warningCount };
}

async function main() {
  log(`${BOLD}🚀 VS Code Extension Development Helper${RESET}\n`, GREEN);

  try {
    // Run type checking for main code
    log(`${BOLD}📋 Checking main TypeScript...${RESET}`, BLUE);
    const mainTypeOutput = runCommand("npm run typecheck", true);
    const mainTypeResults = countErrors(mainTypeOutput);

    // Run type checking for webviews
    log(`${BOLD}📋 Checking webview TypeScript...${RESET}`, BLUE);
    const webviewTypeOutput = runCommand("npm run typecheck:webviews", true);
    const webviewTypeResults = countErrors(webviewTypeOutput);

    // Run linting for main code
    log(`${BOLD}🔍 Linting main code...${RESET}`, BLUE);
    const mainLintOutput = runCommand("npm run lint", true);
    const mainLintResults = countErrors(mainLintOutput);

    // Run linting for webviews
    log(`${BOLD}🔍 Linting webviews...${RESET}`, BLUE);
    const webviewLintOutput = runCommand("npm run lint:webviews", true);
    const webviewLintResults = countErrors(webviewLintOutput);

    // Summary
    const totalErrors =
      mainTypeResults.errorCount +
      webviewTypeResults.errorCount +
      mainLintResults.errorCount +
      webviewLintResults.errorCount;
    const totalWarnings =
      mainTypeResults.warningCount +
      webviewTypeResults.warningCount +
      mainLintResults.warningCount +
      webviewLintResults.warningCount;

    log(`\n${BOLD}📊 Development Check Summary:${RESET}`, GREEN);
    log(`   Errors: ${totalErrors > 0 ? RED : GREEN}${totalErrors}${RESET}`);
    log(
      `   Warnings: ${
        totalWarnings > 0 ? YELLOW : GREEN
      }${totalWarnings}${RESET}`
    );

    if (totalErrors === 0 && totalWarnings === 0) {
      log(`\n${BOLD}✅ All checks passed!${RESET}`, GREEN);
      log(
        `   You can now run: ${BOLD}npm run dev${RESET} to build and test`,
        BLUE
      );
    } else {
      log(
        `\n${BOLD}⚠️  Issues found. Fix them before building.${RESET}`,
        YELLOW
      );

      if (totalErrors > 0) {
        log(`\n${BOLD}🔧 Common fixes:${RESET}`, YELLOW);
        log(`   • Check import statements and module paths`, YELLOW);
        log(`   • Verify function signatures and prop types`, YELLOW);
        log(`   • Ensure all required props are passed`, YELLOW);
        log(`   • Check for missing type definitions`, YELLOW);
      }

      log(`\n${BOLD}🚀 Quick development options:${RESET}`, BLUE);
      log(`   • ${BOLD}npm run dev${RESET} - Full check + build`, BLUE);
      log(
        `   • ${BOLD}npm run dev:quick${RESET} - Skip checks (use only when confident)`,
        BLUE
      );
      log(
        `   • ${BOLD}npm run check${RESET} - Run all checks without building`,
        BLUE
      );
    }
  } catch (error) {
    log(`\n${BOLD}❌ Development check failed${RESET}`, RED);
    log(
      `This usually means there are blocking errors that need to be fixed first.`,
      YELLOW
    );
    process.exit(1);
  }
}

main().catch(console.error);
