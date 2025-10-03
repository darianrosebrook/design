import * as vscode from "vscode";

export interface FontVariant {
  weight: number;
  style: "normal" | "italic";
  url?: string;
}

export interface FontMetadata {
  family: string;
  category?: string;
  variants: FontVariant[];
  source: "google" | "local";
  previewUrl?: string;
}

export class FontCatalogService {
  private static instance: FontCatalogService;
  private fonts: FontMetadata[] = [];
  private isInitialized = false;
  private refreshPromise: Promise<FontMetadata[]> | null = null;

  private constructor(private readonly context: vscode.ExtensionContext) {}

  static getInstance(context: vscode.ExtensionContext): FontCatalogService {
    if (!FontCatalogService.instance) {
      FontCatalogService.instance = new FontCatalogService(context);
    }

    return FontCatalogService.instance;
  }

  async getFonts(forceRefresh = false): Promise<FontMetadata[]> {
    if (this.isInitialized && !forceRefresh) {
      return this.fonts;
    }

    if (this.refreshPromise && !forceRefresh) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshCatalog()
      .then((fonts) => {
        this.fonts = fonts;
        this.isInitialized = true;
        return fonts;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async refreshCatalog(): Promise<FontMetadata[]> {
    const googleFonts = await this.fetchGoogleFonts();
    const localFonts = await this.fetchLocalFonts();

    return [...localFonts, ...googleFonts];
  }

  private async fetchGoogleFonts(): Promise<FontMetadata[]> {
    const apiKey = process.env.GOOGLE_FONTS_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Fonts API responded with ${response.status}`);
      }

      const data = (await response.json()) as {
        items: Array<{
          family: string;
          category?: string;
          variants: string[];
        }>;
      };

      return data.items.map((item) => ({
        family: item.family,
        category: item.category,
        variants: item.variants.map((variant) => {
          const weight = parseInt(variant, 10);
          const isItalic = variant.toLowerCase().includes("italic");

          return {
            weight: Number.isNaN(weight) ? 400 : weight,
            style: isItalic ? "italic" : "normal",
          } as FontVariant;
        }),
        source: "google" as const,
      }));
    } catch (error) {
      console.error("Failed to fetch Google Fonts", error);
      return [];
    }
  }

  private async fetchLocalFonts(): Promise<FontMetadata[]> {
    const configuration = vscode.workspace.getConfiguration("designer.fonts");
    const localFamilies = configuration.get<string[]>("localFamilies", []);

    return localFamilies.map((family) => ({
      family,
      variants: [
        {
          weight: 400,
          style: "normal" as const,
        },
      ],
      source: "local" as const,
    }));
  }

  /**
   * Get fonts in a format suitable for property options
   */
  async getFontOptions(): Promise<Array<{ label: string; value: string }>> {
    const fonts = await this.getFonts();
    return fonts.map((font) => ({
      label: font.family,
      value: font.family,
    }));
  }

  /**
   * Get a specific font by family name
   */
  async getFont(family: string): Promise<FontMetadata | undefined> {
    const fonts = await this.getFonts();
    return fonts.find((font) => font.family === family);
  }

  /**
   * Get available font weights for a family
   */
  async getFontWeights(family: string): Promise<number[]> {
    const font = await this.getFont(family);
    if (!font) {
      return [];
    }

    return font.variants.map((variant) => variant.weight);
  }
}
