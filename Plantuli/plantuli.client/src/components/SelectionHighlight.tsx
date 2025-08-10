import { Ellipse } from 'react-konva';
import type { PlacedPlant } from '../types';

interface SelectionHighlightProps {
  placedPlant: PlacedPlant;
  pixelsPerMeter?: number;
}

export function SelectionHighlight({ placedPlant, pixelsPerMeter = 100 }: SelectionHighlightProps) {
  const { plant, position, scale } = placedPlant;
  
  // Convert real-world coordinates to canvas pixels
  const canvasX = position.x * pixelsPerMeter;
  const canvasY = position.y * pixelsPerMeter;
  
  // Plant size in pixels with padding for highlight
  const radiusX = (plant.size.width * pixelsPerMeter * scale) / 2;
  const radiusY = (plant.size.height * pixelsPerMeter * scale) / 2;
  
  // Highlight padding (extra space around plant)
  const padding = 8;
  const highlightRadiusX = radiusX + padding;
  const highlightRadiusY = radiusY + padding;
  
  console.log('🟢 SelectionHighlight rendering (Ellipse):', {
    plantName: plant.name,
    instanceId: placedPlant.instanceId,
    position,
    canvasCoords: { x: canvasX, y: canvasY },
    radii: { x: highlightRadiusX, y: highlightRadiusY },
    isVisible: true
  });
  
  return (
    <Ellipse
      x={canvasX}
      y={canvasY}
      radiusX={highlightRadiusX}
      radiusY={highlightRadiusY}
      fill="transparent"
      stroke="#3b82f6" // Blue selection color
      strokeWidth={2}
      dash={[8, 4]}
      opacity={0.8}
      listening={false} // CRITICAL: Don't capture events - purely visual
    />
  );
}