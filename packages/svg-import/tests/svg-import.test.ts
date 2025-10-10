/**
 * @fileoverview Tests for SVG import functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, vi } from 'vitest';
import { SVGImportEngine, importSVG } from '../src/index.js';

// Mock xmldom
vi.mock('@xmldom/xmldom', () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn().mockReturnValue({
      documentElement: {
        tagName: 'svg',
        getAttribute: vi.fn(),
        children: []
      },
      getElementsByTagName: vi.fn().mockReturnValue([])
    })
  }))
}));

describe('SVGImportEngine', () => {
  const simpleSVG = `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" fill="#4F46E5" stroke="#000000" stroke-width="2"/>
    </svg>
  `;

  it('should import simple SVG with rectangle', async () => {
    const engine = new SVGImportEngine();
    const result = await engine.import(simpleSVG);

    expect(result.nodes).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.stats.elementsProcessed).toBeGreaterThan(0);
  });

  it('should handle empty SVG', async () => {
    const engine = new SVGImportEngine();
    const result = await engine.import('<svg></svg>');

    expect(result.nodes).toEqual([]);
    expect(result.warnings).toBeDefined();
  });

  it('should detect security issues', async () => {
    const maliciousSVG = `
      <svg>
        <script>alert('xss')</script>
        <rect x="0" y="0" width="100" height="100"/>
      </svg>
    `;

    const engine = new SVGImportEngine();
    const result = await engine.import(maliciousSVG);

    expect(result.warnings.some(w => w.type === 'security_issue')).toBe(true);
  });
});

describe('importSVG convenience function', () => {
  it('should work as expected', async () => {
    const svg = '<svg><rect x="0" y="0" width="50" height="50"/></svg>';
    const result = await importSVG(svg);

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
  });
});
