import type { Position } from '../types';

export class GardenCoordinateSystem {
  private scale: number; // 1px = 1cm
  private origin: Position;

  constructor(realWorldScale: number = 1) {
    this.scale = realWorldScale;
    this.origin = { x: 0, y: 0 };
  }

  canvasToReal(canvasPoint: Position): Position {
    return {
      x: (canvasPoint.x - this.origin.x) * this.scale,
      y: (canvasPoint.y - this.origin.y) * this.scale
    };
  }

  realToCanvas(realPoint: Position): Position {
    return {
      x: (realPoint.x / this.scale) + this.origin.x,
      y: (realPoint.y / this.scale) + this.origin.y
    };
  }

  setOrigin(origin: Position): void {
    this.origin = origin;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  getScale(): number {
    return this.scale;
  }

  getOrigin(): Position {
    return this.origin;
  }
}