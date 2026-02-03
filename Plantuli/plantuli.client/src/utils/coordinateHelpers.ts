import type { Viewport } from '../types';
import {
    PIXELS_PER_METER,
    CANVAS_WIDTH_METERS,
    CANVAS_HEIGHT_METERS,
    POSITION_CLAMP_TOLERANCE,
    DEFAULT_PLANT_POSITION_METERS
} from '../constants';

/**
 * Parámetros para conversión de coordenadas de pantalla a mundo real
 */
export interface CoordinateConversionParams {
    /** Coordenada X en píxeles de pantalla */
    screenX: number;
    /** Coordenada Y en píxeles de pantalla */
    screenY: number;
    /** Rectángulo del canvas en pantalla (null si no está disponible) */
    canvasRect: DOMRect | null;
    /** Estado del viewport (pan y zoom) */
    viewport: Viewport;
}

/**
 * Convierte coordenadas de pantalla a coordenadas del mundo real (metros)
 * 
 * Realiza la siguiente transformación:
 * 1. Screen coordinates → Canvas-relative coordinates
 * 2. Canvas-relative → Canvas content coordinates (aplicando pan y zoom)
 * 3. Canvas pixels → Real-world meters
 * 4. Clamping a los límites del canvas
 * 
 * @param params - Parámetros de conversión
 * @returns Coordenadas en metros del mundo real, ya clampadas a los límites del canvas
 */
export function convertScreenToRealWorld(
    params: CoordinateConversionParams
): { x: number; y: number } {
    const { screenX, screenY, canvasRect, viewport } = params;
    
    let canvasX: number;
    let canvasY: number;
    
    if (canvasRect) {
        // 1. Convert screen coordinates to canvas-relative coordinates
        const canvasRelativeX = screenX - canvasRect.left;
        const canvasRelativeY = screenY - canvasRect.top;
        
        // 2. Convert from viewport coordinates to content coordinates
        // Account for the pan offset and zoom
        canvasX = (canvasRelativeX - viewport.pan.x) / viewport.zoom;
        canvasY = (canvasRelativeY - viewport.pan.y) / viewport.zoom;
    } else {
        // Fallback: use a default position if canvas rect not available
        canvasX = DEFAULT_PLANT_POSITION_METERS * PIXELS_PER_METER;
        canvasY = DEFAULT_PLANT_POSITION_METERS * PIXELS_PER_METER;
    }
    
    // 3. Convert from canvas pixels to real-world meters
    const realX = canvasX / PIXELS_PER_METER;
    const realY = canvasY / PIXELS_PER_METER;
    
    // 4. Validate that the position is within canvas bounds and clamp if necessary
    const canvasBounds = { width: CANVAS_WIDTH_METERS, height: CANVAS_HEIGHT_METERS };
    const clampedRealX = Math.max(0, Math.min(canvasBounds.width - POSITION_CLAMP_TOLERANCE, realX));
    const clampedRealY = Math.max(0, Math.min(canvasBounds.height - POSITION_CLAMP_TOLERANCE, realY));
    
    return { x: clampedRealX, y: clampedRealY };
}
