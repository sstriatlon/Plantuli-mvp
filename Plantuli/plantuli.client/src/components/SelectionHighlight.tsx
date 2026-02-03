import { Ellipse } from 'react-konva';
import { SELECTION_HIGHLIGHT_PADDING, DASH_PATTERN } from '../constants';
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
  const highlightRadiusX = radiusX + SELECTION_HIGHLIGHT_PADDING;
  const highlightRadiusY = radiusY + SELECTION_HIGHLIGHT_PADDING;
  
  return (
    <Ellipse
      x={canvasX}
      y={canvasY}
      radiusX={highlightRadiusX}
      radiusY={highlightRadiusY}
      fill="transparent"
      stroke="#a0a0a0ff"
      strokeWidth={1.5}
      dash={DASH_PATTERN}
      opacity={0.8}
      listening={false} // CRITICAL: Don't capture events - purely visual
    />
  );
}