/**
 * @fileoverview Coordinate System Utilities for Canvas Surface
 * @author @darianrosebrook
 *
 * Provides world/view coordinate transformations and HiDPI scaling
 * as specified in DESIGNER-022 section 3.1
 */

import type {
  PointType,
  RectangleType,
  TransformMatrixType,
  CameraStateType,
} from "../protocol/bridge-types.js";

/**
 * Coordinate system manager for canvas surface
 */
export class CoordinateSystem {
  private devicePixelRatio: number;
  private camera: CameraStateType;

  constructor() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.camera = {
      panX: 0,
      panY: 0,
      zoom: 1,
    };
  }

  /**
   * Get current device pixel ratio for HiDPI scaling
   */
  getDevicePixelRatio(): number {
    return this.devicePixelRatio;
  }

  /**
   * Update device pixel ratio (call when window changes)
   */
  updateDevicePixelRatio(): void {
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  /**
   * Get current camera state
   */
  getCamera(): CameraStateType {
    return { ...this.camera };
  }

  /**
   * Set camera state
   */
  setCamera(camera: Partial<CameraStateType>): void {
    this.camera = {
      ...this.camera,
      ...camera,
      // Clamp zoom to valid range
      zoom: Math.max(0.1, Math.min(8, camera.zoom ?? this.camera.zoom)),
    };
  }

  /**
   * Pan the camera by delta amounts
   */
  pan(deltaX: number, deltaY: number): void {
    this.camera.panX += deltaX;
    this.camera.panY += deltaY;
  }

  /**
   * Zoom the camera with focal point
   */
  zoomTo(focalPoint: PointType, newZoom: number): void {
    const clampedZoom = Math.max(0.1, Math.min(8, newZoom));

    // Calculate world position of focal point before zoom
    const worldBefore = this.viewToWorld(focalPoint);

    // Update zoom
    this.camera.zoom = clampedZoom;

    // Calculate new view position of same world point
    const viewAfter = this.worldToView(worldBefore);

    // Adjust pan to keep focal point in same view position
    this.camera.panX += focalPoint.x - viewAfter.x;
    this.camera.panY += focalPoint.y - viewAfter.y;

    this.camera.focalPoint = focalPoint;
  }

  /**
   * Zoom in by a factor
   */
  zoomIn(focalPoint?: PointType, factor: number = 1.2): void {
    const point = focalPoint || { x: 0, y: 0 };
    this.zoomTo(point, this.camera.zoom * factor);
  }

  /**
   * Zoom out by a factor
   */
  zoomOut(focalPoint?: PointType, factor: number = 1.2): void {
    const point = focalPoint || { x: 0, y: 0 };
    this.zoomTo(point, this.camera.zoom / factor);
  }

  /**
   * Fit content to view bounds
   */
  fitToBounds(
    bounds: RectangleType,
    viewWidth: number,
    viewHeight: number
  ): void {
    const padding = 40; // Padding around content
    const availableWidth = viewWidth - padding * 2;
    const availableHeight = viewHeight - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    // Center the content
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    this.camera.zoom = scale;
    this.camera.panX = viewWidth / 2 - centerX * scale;
    this.camera.panY = viewHeight / 2 - centerY * scale;
  }

  /**
   * Convert world coordinates to view coordinates
   */
  worldToView(worldPoint: PointType): PointType {
    return {
      x: worldPoint.x * this.camera.zoom + this.camera.panX,
      y: worldPoint.y * this.camera.zoom + this.camera.panY,
    };
  }

  /**
   * Convert view coordinates to world coordinates
   */
  viewToWorld(viewPoint: PointType): PointType {
    return {
      x: (viewPoint.x - this.camera.panX) / this.camera.zoom,
      y: (viewPoint.y - this.camera.panY) / this.camera.zoom,
    };
  }

  /**
   * Convert world rectangle to view rectangle
   */
  worldRectToView(worldRect: RectangleType): RectangleType {
    const topLeft = this.worldToView({ x: worldRect.x, y: worldRect.y });
    const bottomRight = this.worldToView({
      x: worldRect.x + worldRect.width,
      y: worldRect.y + worldRect.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  /**
   * Convert view rectangle to world rectangle
   */
  viewRectToWorld(viewRect: RectangleType): RectangleType {
    const topLeft = this.viewToWorld({ x: viewRect.x, y: viewRect.y });
    const bottomRight = this.viewToWorld({
      x: viewRect.x + viewRect.width,
      y: viewRect.y + viewRect.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  /**
   * Get transform matrix for canvas context
   */
  getTransformMatrix(): TransformMatrixType {
    return {
      scaleX: this.camera.zoom,
      scaleY: this.camera.zoom,
      translateX: this.camera.panX,
      translateY: this.camera.panY,
      skewX: 0,
      skewY: 0,
    };
  }

  /**
   * Apply transform to canvas context
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(
      this.camera.zoom,
      0,
      0,
      this.camera.zoom,
      this.camera.panX,
      this.camera.panY
    );
  }

  /**
   * Reset transform to identity
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Get HiDPI scaled canvas size
   */
  getCanvasSize(
    cssWidth: number,
    cssHeight: number
  ): { width: number; height: number } {
    return {
      width: cssWidth * this.devicePixelRatio,
      height: cssHeight * this.devicePixelRatio,
    };
  }

  /**
   * Set up canvas for HiDPI rendering
   */
  setupHiDPICanvas(
    canvas: HTMLCanvasElement,
    cssWidth: number,
    cssHeight: number
  ): void {
    const { width, height } = this.getCanvasSize(cssWidth, cssHeight);

    // Set actual canvas size in device pixels
    canvas.width = width;
    canvas.height = height;

    // Set CSS size in logical pixels
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Scale context for HiDPI
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }
  }

  /**
   * Check if a point is within a rectangle (world coordinates)
   */
  pointInRect(point: PointType, rect: RectangleType): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Check if a rectangle intersects with another rectangle (world coordinates)
   */
  rectIntersects(rect1: RectangleType, rect2: RectangleType): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Get distance between two points
   */
  distance(point1: PointType, point2: PointType): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get angle between two points (in radians)
   */
  angle(point1: PointType, point2: PointType): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  /**
   * Snap point to grid
   */
  snapToGrid(point: PointType, gridSize: number): PointType {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  /**
   * Get bounds of multiple points
   */
  getBounds(points: PointType[]): RectangleType {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
