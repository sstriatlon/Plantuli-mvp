import { Line, Text } from 'react-konva';
import {
    RULER_SIZE,
    PIXELS_PER_METER,
    GRID_TARGET_SPACING,
    GRID_MAJOR_SPACING_VALUES,
    GRID_MINOR_DIVISOR
} from '../../../shared/constants';
import type { Viewport } from '../../../shared/types';

interface RulersProps {
  dimensions: { width: number; height: number };
  viewport: Viewport;
}

export function Rulers({ dimensions, viewport }: RulersProps) {
  // Major line spacing - fewer steps, bigger jumps
  const getMajorSpacing = (zoom: number) => {
    const pixelsPerMeter = PIXELS_PER_METER * zoom;
    const metersPerLabel = GRID_TARGET_SPACING / pixelsPerMeter;
    
    return GRID_MAJOR_SPACING_VALUES.reduce((prev, curr) => 
      Math.abs(curr - metersPerLabel) < Math.abs(prev - metersPerLabel) ? curr : prev
    );
  };
  
  const majorSpacing = getMajorSpacing(viewport.zoom);
  const minorSpacing = majorSpacing / GRID_MINOR_DIVISOR;

  const renderHorizontalRuler = () => {
    const elements = [];
    const { width } = dimensions;
    
    // Ruler background
    elements.push(
      <Line
        key="h-ruler-bg"
        points={[0, 0, width, 0, width, RULER_SIZE, 0, RULER_SIZE]}
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth={1}
        closed={true}
      />
    );

    // Calculate visible ranges separately for major and minor
    const startMajor = Math.floor((-viewport.pan.x / viewport.zoom) / PIXELS_PER_METER / majorSpacing) * majorSpacing;
    const endMajor = startMajor + (width / viewport.zoom / PIXELS_PER_METER) + majorSpacing;
    
    const startMinor = Math.floor((-viewport.pan.x / viewport.zoom) / PIXELS_PER_METER / minorSpacing) * minorSpacing;
    const endMinor = startMinor + (width / viewport.zoom / PIXELS_PER_METER) + minorSpacing;

    // First render minor ticks
    for (let meters = startMinor; meters <= endMinor; meters += minorSpacing) {
      // Skip if this position will be a major tick
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue;
      
      const canvasX = meters * PIXELS_PER_METER;
      const screenX = (canvasX * viewport.zoom) + viewport.pan.x;
      
      if (screenX >= 0 && screenX <= width) {
        elements.push(
          <Line
            key={`h-minor-${meters}`}
            points={[screenX, RULER_SIZE - 10, screenX, RULER_SIZE]}
            stroke="#666"
            strokeWidth={0.5}
          />
        );
      }
    }

    // Then render major ticks with labels
    for (let meters = startMajor; meters <= endMajor; meters += majorSpacing) {
      const canvasX = meters * PIXELS_PER_METER;
      const screenX = (canvasX * viewport.zoom) + viewport.pan.x;
      
      if (screenX >= 0 && screenX <= width) {
        // Major tick line
        elements.push(
          <Line
            key={`h-major-${meters}`}
            points={[screenX, RULER_SIZE - 20, screenX, RULER_SIZE]}
            stroke="#666"
            strokeWidth={1}
          />
        );

        // Label ONLY for major ticks
        if (meters >= 0) {
          const formatLabel = (value: number) => {
            if (value === 0) return '0m';
            if (value < 1) return `${Math.round(value * 100)}cm`;
            
            // For values >= 1m, use precise formatting with max 2 decimals
            const rounded = Math.round(value * 100) / 100; // Round to 2 decimal places
            if (rounded % 1 === 0) return `${rounded.toFixed(0)}m`; // Integer values
            if (rounded % 0.1 === 0) return `${rounded.toFixed(1)}m`; // One decimal needed
            return `${rounded.toFixed(2)}m`; // Two decimals needed
          };

          elements.push(
            <Text
              key={`h-label-${meters}`}
              x={screenX - 15}
              y={5}
              text={formatLabel(meters)}
              fontSize={10}
              fill="#666"
              width={30}
              align="center"
            />
          );
        }
      }
    }

    return elements;
  };

  const renderVerticalRuler = () => {
    const elements = [];
    const { height } = dimensions;
    
    // Ruler background
    elements.push(
      <Line
        key="v-ruler-bg"
        points={[0, 0, RULER_SIZE, 0, RULER_SIZE, height, 0, height]}
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth={1}
        closed={true}
      />
    );

    // Calculate visible ranges separately for major and minor
    const startMajor = Math.floor((-viewport.pan.y / viewport.zoom) / PIXELS_PER_METER / majorSpacing) * majorSpacing;
    const endMajor = startMajor + (height / viewport.zoom / PIXELS_PER_METER) + majorSpacing;
    
    const startMinor = Math.floor((-viewport.pan.y / viewport.zoom) / PIXELS_PER_METER / minorSpacing) * minorSpacing;
    const endMinor = startMinor + (height / viewport.zoom / PIXELS_PER_METER) + minorSpacing;

    // First render minor ticks
    for (let meters = startMinor; meters <= endMinor; meters += minorSpacing) {
      // Skip if this position will be a major tick
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue;
      
      const canvasY = meters * PIXELS_PER_METER;
      const screenY = (canvasY * viewport.zoom) + viewport.pan.y;
      
      if (screenY >= 0 && screenY <= height) {
        elements.push(
          <Line
            key={`v-minor-${meters}`}
            points={[RULER_SIZE - 10, screenY, RULER_SIZE, screenY]}
            stroke="#666"
            strokeWidth={0.5}
          />
        );
      }
    }

    // Then render major ticks with labels
    for (let meters = startMajor; meters <= endMajor; meters += majorSpacing) {
      const canvasY = meters * PIXELS_PER_METER;
      const screenY = (canvasY * viewport.zoom) + viewport.pan.y;
      
      if (screenY >= 0 && screenY <= height) {
        // Major tick line
        elements.push(
          <Line
            key={`v-major-${meters}`}
            points={[RULER_SIZE - 20, screenY, RULER_SIZE, screenY]}
            stroke="#666"
            strokeWidth={1}
          />
        );

        // Label ONLY for major ticks
        if (meters >= 0) {
          const formatLabel = (value: number) => {
            if (value === 0) return '0m';
            if (value < 1) return `${Math.round(value * 100)}cm`;
            
            // For values >= 1m, use precise formatting with max 2 decimals
            const rounded = Math.round(value * 100) / 100; // Round to 2 decimal places
            if (rounded % 1 === 0) return `${rounded.toFixed(0)}m`; // Integer values
            if (rounded % 0.1 === 0) return `${rounded.toFixed(1)}m`; // One decimal needed
            return `${rounded.toFixed(2)}m`; // Two decimals needed
          };

          elements.push(
            <Text
              key={`v-label-${meters}`}
              x={2}
              y={screenY - 5}
              text={formatLabel(meters)}
              fontSize={10}
              fill="#666"
              rotation={0}
            />
          );
        }
      }
    }

    return elements;
  };

  return (
    <>
      {/* Horizontal ruler */}
      {renderHorizontalRuler()}
      
      {/* Vertical ruler */}
      {renderVerticalRuler()}
      
      {/* Corner square */}
      <Line
        points={[0, 0, RULER_SIZE, 0, RULER_SIZE, RULER_SIZE, 0, RULER_SIZE]}
        fill="#e8e8e8"
        stroke="#d0d0d0"
        strokeWidth={1}
        closed={true}
      />
    </>
  );
}