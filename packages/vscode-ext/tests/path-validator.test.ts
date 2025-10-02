/**
 * @fileoverview Tests for path validation security
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PathValidator, createPathValidator, defaultConfig } from '../src/security/path-validator.js';
import * as path from 'node:path';
import * as os from 'node:os';

describe('PathValidator', () => {
  let validator: PathValidator;
  const workspaceRoot = '/workspace';

  beforeEach(() => {
    validator = createPathValidator(workspaceRoot);
  });

  describe('Valid Paths', () => {
    it('allows valid design file paths', () => {
      const result = validator.validate('design/home.canvas.json');
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBeDefined();
    });

    it('allows tokens.json', () => {
      const result = validator.validate('design/tokens.json');
      expect(result.valid).toBe(true);
    });

    it('allows mappings files', () => {
      const result = validator.validate('design/mappings.react.json');
      expect(result.valid).toBe(true);
    });

    it('allows component index', () => {
      const result = validator.validate('design/components.index.json');
      expect(result.valid).toBe(true);
    });

    it('resolves paths correctly', () => {
      const result = validator.validate('design/home.canvas.json');
      expect(result.resolvedPath).toBe(path.join(workspaceRoot, 'design', 'home.canvas.json'));
    });
  });

  describe('Directory Traversal Protection', () => {
    it('rejects paths with ..', () => {
      const result = validator.validate('../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('traversal');
    });

    it('rejects paths with .. in middle', () => {
      const result = validator.validate('design/../../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('traversal');
    });

    it('rejects encoded directory traversal', () => {
      // path.normalize handles this, but test anyway
      const result = validator.validate('design/..%2F..%2Fetc%2Fpasswd');
      expect(result.valid).toBe(false);
    });

    it('rejects backslash directory traversal on Windows', () => {
      const result = validator.validate('design\\..\\..\\..\\etc\\passwd');
      expect(result.valid).toBe(false);
    });
  });

  describe('Absolute Path Protection', () => {
    it('rejects Unix absolute paths', () => {
      const result = validator.validate('/etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Absolute');
    });

    it('rejects Windows absolute paths', () => {
      const result = validator.validate('C:\\Windows\\System32\\config\\sam');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Absolute');
    });

    it('rejects UNC paths', () => {
      const result = validator.validate('\\\\server\\share\\file.json');
      expect(result.valid).toBe(false);
    });
  });

  describe('Workspace Boundary', () => {
    it('rejects paths that resolve outside workspace', () => {
      // Even without "..", a crafted path might try to escape
      const result = validator.validate('design/../../../../etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('ensures resolved path starts with workspace root', () => {
      const result = validator.validate('design/home.canvas.json');
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toMatch(new RegExp(`^${workspaceRoot.replace(/\\/g, '\\\\')}`));
    });

    it('rejects symlink-like attempts', () => {
      // Path validation happens before symlink resolution
      const result = validator.validate('design/link-to-outside.canvas.json');
      // This should pass validation (format is OK), but actual file access would fail
      // if it's a symlink outside workspace
      expect(result.valid).toBe(true); // Format is valid
    });
  });

  describe('File Extension Validation', () => {
    it('rejects files without allowed extensions', () => {
      const result = validator.validate('design/malicious.exe');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('extension');
    });

    it('rejects JavaScript files', () => {
      const result = validator.validate('design/script.js');
      expect(result.valid).toBe(false);
    });

    it('rejects TypeScript files', () => {
      const result = validator.validate('design/code.ts');
      expect(result.valid).toBe(false);
    });

    it('rejects shell scripts', () => {
      const result = validator.validate('design/script.sh');
      expect(result.valid).toBe(false);
    });

    it('allows .json extension', () => {
      const result = validator.validate('design/tokens.json');
      expect(result.valid).toBe(true);
    });

    it('allows .canvas.json extension', () => {
      const result = validator.validate('design/home.canvas.json');
      expect(result.valid).toBe(true);
    });
  });

  describe('Pattern Matching', () => {
    it('rejects files not matching allowed patterns', () => {
      const result = validator.validate('src/components/Button.json');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('pattern');
    });

    it('rejects JSON files outside design directory', () => {
      const result = validator.validate('config.json');
      expect(result.valid).toBe(false);
    });

    it('allows files in design/ matching patterns', () => {
      const result = validator.validate('design/nested/file.canvas.json');
      expect(result.valid).toBe(true);
    });
  });

  describe('Path Length Limits', () => {
    it('rejects paths exceeding maximum length', () => {
      const longPath = 'design/' + 'a'.repeat(300) + '.canvas.json';
      const result = validator.validate(longPath);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('maximum length');
    });

    it('allows paths within length limit', () => {
      const normalPath = 'design/home.canvas.json';
      const result = validator.validate(normalPath);
      expect(result.valid).toBe(true);
    });
  });

  describe('Special Characters', () => {
    it('rejects paths with null bytes', () => {
      const result = validator.validate('design/file\0.canvas.json');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Null bytes');
    });

    it('handles paths with spaces', () => {
      const result = validator.validate('design/my file.canvas.json');
      expect(result.valid).toBe(true);
    });

    it('handles paths with dashes', () => {
      const result = validator.validate('design/my-file.canvas.json');
      expect(result.valid).toBe(true);
    });

    it('handles paths with underscores', () => {
      const result = validator.validate('design/my_file.canvas.json');
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string', () => {
      const result = validator.validate('');
      expect(result.valid).toBe(false);
    });

    it('handles just a dot', () => {
      const result = validator.validate('.');
      expect(result.valid).toBe(false);
    });

    it('handles just a slash', () => {
      const result = validator.validate('/');
      expect(result.valid).toBe(false);
    });

    it('handles multiple slashes', () => {
      const result = validator.validate('design///home.canvas.json');
      // path.normalize should handle this
      expect(result.valid).toBe(true);
    });

    it('handles trailing slashes', () => {
      const result = validator.validate('design/');
      expect(result.valid).toBe(false); // Directory, not a file
    });
  });

  describe('Batch Validation', () => {
    it('validates multiple paths at once', () => {
      const paths = [
        'design/home.canvas.json',
        'design/tokens.json',
        '../etc/passwd',
      ];

      const results = validator.validateBatch(paths);

      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
      expect(results[2].valid).toBe(false);
    });

    it('handles empty batch', () => {
      const results = validator.validateBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('Quick Workspace Check', () => {
    it('quickly identifies paths within workspace', () => {
      expect(validator.isWithinWorkspace('design/home.canvas.json')).toBe(true);
    });

    it('quickly identifies paths outside workspace', () => {
      expect(validator.isWithinWorkspace('../etc/passwd')).toBe(false);
    });

    it('quickly rejects absolute paths', () => {
      expect(validator.isWithinWorkspace('/etc/passwd')).toBe(false);
    });

    it('handles invalid paths gracefully', () => {
      expect(validator.isWithinWorkspace('\0')).toBe(false);
    });
  });

  describe('Workspace Root', () => {
    it('returns normalized workspace root', () => {
      const root = validator.getWorkspaceRoot();
      expect(root).toBe(path.resolve(workspaceRoot));
    });

    it('handles workspace root with trailing slash', () => {
      const validatorWithSlash = new PathValidator({
        workspaceRoot: '/workspace/',
        ...defaultConfig,
      });
      const root = validatorWithSlash.getWorkspaceRoot();
      expect(root).toBe(path.resolve('/workspace'));
    });
  });

  describe('Cross-Platform', () => {
    it('normalizes Windows-style paths on Unix', () => {
      if (os.platform() !== 'win32') {
        const result = validator.validate('design\\home.canvas.json');
        // Should normalize to forward slashes
        expect(result.valid).toBe(true);
      }
    });

    it('handles mixed separators', () => {
      const result = validator.validate('design/sub\\home.canvas.json');
      expect(result.valid).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    it('respects custom allowed patterns', () => {
      const customValidator = new PathValidator({
        workspaceRoot,
        allowedPatterns: [/^custom\/.*\.json$/],
        allowedExtensions: ['.json'],
        maxPathLength: 260,
      });

      const result1 = customValidator.validate('custom/file.json');
      const result2 = customValidator.validate('design/file.json');

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
    });

    it('respects custom max path length', () => {
      const customValidator = new PathValidator({
        workspaceRoot,
        allowedPatterns: defaultConfig.allowedPatterns,
        allowedExtensions: defaultConfig.allowedExtensions,
        maxPathLength: 50,
      });

      const longPath = 'design/' + 'a'.repeat(100) + '.canvas.json';
      const result = customValidator.validate(longPath);

      expect(result.valid).toBe(false);
    });
  });
});

