/**
 * @fileoverview Secure File System Service for VS Code Extension
 * @author @darianrosebrook
 *
 * Provides secure file system access with path validation and workspace boundaries.
 * All file operations are validated to prevent directory traversal and ensure
 * operations remain within the workspace root.
 */

import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { PathValidator, createPathValidator } from "./path-validator";

/**
 * File system operation result
 */
export interface FileSystemResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  size: number;
  mtime: number;
  ctime: number;
  isDirectory: boolean;
  isFile: boolean;
}

/**
 * File system service configuration
 */
export interface FileSystemServiceConfig {
  workspaceRoot: string;
  allowOutsideWorkspace?: boolean;
  maxFileSize?: number;
  allowedExtensions?: string[];
}

/**
 * Secure file system service for VS Code extensions
 *
 * Provides validated file system operations that ensure all access
 * remains within secure boundaries and follows VS Code best practices.
 *
 * @example
 * ```typescript
 * const fsService = new FileSystemService({
 *   workspaceRoot: workspaceFolder.uri.fsPath,
 *   allowedExtensions: ['.json', '.canvas.json']
 * });
 *
 * const result = await fsService.readFile('design/document.canvas.json');
 * if (result.success) {
 *   console.log('File content:', result.data);
 * }
 * ```
 */
export class FileSystemService {
  private config: FileSystemServiceConfig;
  private pathValidator: PathValidator;
  private workspaceFolder?: vscode.WorkspaceFolder;

  constructor(config: FileSystemServiceConfig) {
    this.config = {
      allowOutsideWorkspace: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      allowedExtensions: [".json", ".canvas.json", ".md", ".txt"],
      ...config,
    };

    this.pathValidator = createPathValidator(config.workspaceRoot);

    // Find the workspace folder
    if (vscode.workspace.workspaceFolders) {
      this.workspaceFolder = vscode.workspace.workspaceFolders.find(
        (folder) => folder.uri.fsPath === config.workspaceRoot
      );
    }
  }

  /**
   * Validate a file path for security
   */
  validatePath(filePath: string): {
    valid: boolean;
    resolvedPath?: string;
    error?: string;
  } {
    const validation = this.pathValidator.validate(filePath);

    if (!validation.valid) {
      return { valid: false, error: validation.reason };
    }

    // Additional workspace boundary check if required
    if (!this.config.allowOutsideWorkspace && this.workspaceFolder) {
      const resolvedUri = vscode.Uri.file(validation.resolvedPath!);
      if (!this.isWithinWorkspace(resolvedUri)) {
        return {
          valid: false,
          error: "Path resolves outside workspace boundary",
        };
      }
    }

    return { valid: true, resolvedPath: validation.resolvedPath };
  }

  /**
   * Check if a URI is within the workspace
   */
  private isWithinWorkspace(uri: vscode.Uri): boolean {
    if (!this.workspaceFolder) return false;

    const filePath = uri.fsPath;
    const workspacePath = this.workspaceFolder.uri.fsPath;

    // Ensure file path starts with workspace path
    if (!filePath.startsWith(workspacePath)) {
      return false;
    }

    // Additional check: ensure no parent directory traversal beyond workspace
    const relativePath = filePath.substring(workspacePath.length);
    if (relativePath.includes("../") || relativePath.startsWith("../")) {
      return false;
    }

    return true;
  }

  /**
   * Read a file securely
   */
  async readFile(filePath: string): Promise<FileSystemResult<string>> {
    try {
      const validation = this.validatePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Check file extension if restrictions are in place
      if (
        this.config.allowedExtensions &&
        this.config.allowedExtensions.length > 0
      ) {
        const ext = path.extname(resolvedPath);
        if (!this.config.allowedExtensions.includes(ext)) {
          return {
            success: false,
            error: `File extension '${ext}' is not allowed. Allowed: ${this.config.allowedExtensions.join(
              ", "
            )}`,
          };
        }
      }

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      let content: Uint8Array;
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        content = await vscode.workspace.fs.readFile(uri);
      } else {
        content = await fs.readFile(resolvedPath);
      }

      // Check file size limit
      if (this.config.maxFileSize && content.length > this.config.maxFileSize) {
        return {
          success: false,
          error: `File size ${content.length} bytes exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
        };
      }

      // Convert to string (assume UTF-8)
      const textContent = new TextDecoder("utf-8").decode(content);

      return { success: true, data: textContent };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Write a file securely
   */
  async writeFile(
    filePath: string,
    content: string
  ): Promise<FileSystemResult<void>> {
    try {
      const validation = this.validatePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Check file extension if restrictions are in place
      if (
        this.config.allowedExtensions &&
        this.config.allowedExtensions.length > 0
      ) {
        const ext = path.extname(resolvedPath);
        if (!this.config.allowedExtensions.includes(ext)) {
          return {
            success: false,
            error: `File extension '${ext}' is not allowed. Allowed: ${this.config.allowedExtensions.join(
              ", "
            )}`,
          };
        }
      }

      // Check content size
      const contentSize = new Blob([content]).size;
      if (this.config.maxFileSize && contentSize > this.config.maxFileSize) {
        return {
          success: false,
          error: `Content size ${contentSize} bytes exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
        };
      }

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      const contentBytes = new TextEncoder().encode(content);
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        await vscode.workspace.fs.writeFile(uri, contentBytes);
      } else {
        await fs.writeFile(resolvedPath, contentBytes, "utf-8");
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<FileSystemResult<boolean>> {
    try {
      const validation = this.validatePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        try {
          await vscode.workspace.fs.stat(uri);
          return { success: true, data: true };
        } catch {
          return { success: true, data: false };
        }
      } else {
        try {
          await fs.access(resolvedPath);
          return { success: true, data: true };
        } catch {
          return { success: true, data: false };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to check file existence: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    filePath: string
  ): Promise<FileSystemResult<FileMetadata>> {
    try {
      const validation = this.validatePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      let stat: vscode.FileStat | fsSync.Stats;
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        stat = await vscode.workspace.fs.stat(uri);
      } else {
        stat = await fs.stat(resolvedPath);
      }

      const metadata: FileMetadata = {
        size: stat.size,
        mtime: stat.mtime instanceof Date ? stat.mtime.getTime() : stat.mtime,
        ctime: stat.ctime instanceof Date ? stat.ctime.getTime() : stat.ctime,
        isDirectory: (stat as any).isDirectory?.() ?? false,
        isFile: (stat as any).isFile?.() ?? true,
      };

      return { success: true, data: metadata };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get file metadata: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Create a directory securely
   */
  async createDirectory(dirPath: string): Promise<FileSystemResult<void>> {
    try {
      const validation = this.validatePath(dirPath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        await vscode.workspace.fs.createDirectory(uri);
      } else {
        await fs.mkdir(resolvedPath, { recursive: true });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * List directory contents securely
   */
  async listDirectory(
    dirPath: string
  ): Promise<FileSystemResult<vscode.Uri[]>> {
    try {
      const validation = this.validatePath(dirPath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Use VS Code's workspace.fs if within workspace
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        const entries = await vscode.workspace.fs.readDirectory(uri);
        const uris = entries.map(([name]) => vscode.Uri.joinPath(uri, name));
        return { success: true, data: uris };
      } else {
        // For directories outside workspace, use Node.js fs but limit results
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
        const uris = entries.map((entry) =>
          vscode.Uri.file(path.join(resolvedPath, entry.name))
        );
        return { success: true, data: uris };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Delete a file or directory securely
   */
  async delete(filePath: string): Promise<FileSystemResult<void>> {
    try {
      const validation = this.validatePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const resolvedPath = validation.resolvedPath!;

      // Use VS Code's workspace.fs if within workspace, otherwise Node.js fs
      if (
        this.workspaceFolder &&
        this.isWithinWorkspace(vscode.Uri.file(resolvedPath))
      ) {
        const uri = vscode.Uri.file(resolvedPath);
        await vscode.workspace.fs.delete(uri, { recursive: true });
      } else {
        const metadata = await this.getFileMetadata(filePath);
        if (metadata.success && metadata.data?.isDirectory) {
          await fs.rm(resolvedPath, { recursive: true, force: true });
        } else {
          await fs.unlink(resolvedPath);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Find files matching a pattern
   */
  async findFiles(
    pattern: string,
    exclude?: string
  ): Promise<FileSystemResult<vscode.Uri[]>> {
    try {
      if (!this.workspaceFolder) {
        return { success: false, error: "No workspace folder available" };
      }

      const relativePattern = new vscode.RelativePattern(
        this.workspaceFolder,
        pattern
      );
      const uris = await vscode.workspace.findFiles(relativePattern, exclude);

      // Validate all found files are within workspace
      const validatedUris = uris.filter((uri) => this.isWithinWorkspace(uri));

      return { success: true, data: validatedUris };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find files: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Get the workspace root path
   */
  getWorkspaceRoot(): string {
    return this.config.workspaceRoot;
  }

  /**
   * Convert a relative path to an absolute path within workspace
   */
  resolvePath(relativePath: string): string {
    return path.resolve(this.config.workspaceRoot, relativePath);
  }

  /**
   * Convert an absolute path to a relative path within workspace
   */
  relativePath(absolutePath: string): string {
    return path.relative(this.config.workspaceRoot, absolutePath);
  }
}

/**
 * Create a file system service with default configuration for Designer
 */
export function createFileSystemService(
  workspaceRoot: string
): FileSystemService {
  return new FileSystemService({
    workspaceRoot,
    allowOutsideWorkspace: false,
    maxFileSize: 50 * 1024 * 1024, // 50MB for large canvas files
    allowedExtensions: [
      ".json",
      ".canvas.json",
      ".components.json",
      ".md",
      ".txt",
    ],
  });
}
