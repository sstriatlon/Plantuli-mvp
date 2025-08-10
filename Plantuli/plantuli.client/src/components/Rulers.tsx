import { Line, Text } from 'react-konva';
import type { Viewport } from '../types';

interface RulersProps {
  dimensions: { width: number; height: number };
  viewport: Viewport;
}

export function Rulers({ dimensions, viewport }: RulersProps) {
  const rulerSize = 30;
  const basePx = 100; // 100px = 1m at zoom 1x
  
  // Major line spacing - fewer steps, bigger jumps
  const getMajorSpacing = (zoom: number) => {
    const pixelsPerMeter = basePx * zoom;
    
    // Target: major labels every 80-150px for clean look
    const targetSpacing = 100;
    const metersPerLabel = targetSpacing / pixelsPerMeter;
    
    // Conservative nice values with bigger jumps: 0.25, 0.5, 1, 2.5, 5, 10, etc.
    const majorValues = [0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100];
    
    return majorValues.reduce((prev, curr) => 
      Math.abs(curr - metersPerLabel) < Math.abs(prev - metersPerLabel) ? curr : prev
    );
  };
  
  const majorSpacing = getMajorSpacing(viewport.zoom);
  const minorSpacing = majorSpacing / 4; // Minor lines every 1/4 of major spacing

  const renderHorizontalRuler = () => {
    const elements = [];
    const { width } = dimensions;
    
    // Ruler background
    elements.push(
      <Line
        key="h-ruler-bg"
        points={[0, 0, width, 0, width, rulerSize, 0, rulerSize]}
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth={1}
        closed={true}
      />
    );

    // Calculate visible ranges separately for major and minor
    const startMajor = Math.floor((-viewport.pan.x / viewport.zoom) / basePx / majorSpacing) * majorSpacing;
    const endMajor = startMajor + (width / viewport.zoom / basePx) + majorSpacing;
    
    const startMinor = Math.floor((-viewport.pan.x / viewport.zoom) / basePx / minorSpacing) * minorSpacing;
    const endMinor = startMinor + (width / viewport.zoom / basePx) + minorSpacing;

    // First render minor ticks
    for (let meters = startMinor; meters <= endMinor; meters += minorSpacing) {
      // Skip if this position will be a major tick
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue;
      
      const canvasX = meters * basePx;
      const screenX = (canvasX * viewport.zoom) + viewport.pan.x;
      
      if (screenX >= 0 && screenX <= width) {
        elements.push(
          <Line
            key={`h-minor-${meters}`}
            points={[screenX, rulerSize - 10, screenX, rulerSize]}
            stroke="#666"
            strokeWidth={0.5}
          />
        );
      }
    }

    // Then render major ticks with labels
    for (let meters = startMajor; meters <= endMajor; meters += majorSpacing) {
      const canvasX = meters * basePx;
      const screenX = (canvasX * viewport.zoom) + viewport.pan.x;
      
      if (screenX >= 0 && screenX <= width) {
        // Major tick line
        elements.push(
          <Line
            key={`h-major-${meters}`}
            points={[screenX, rulerSize - 20, screenX, rulerSize]}
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
        points={[0, 0, rulerSize, 0, rulerSize, height, 0, height]}
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth={1}
        closed={true}
      />
    );

    // Calculate visible ranges separately for major and minor
    const startMajor = Math.floor((-viewport.pan.y / viewport.zoom) / basePx / majorSpacing) * majorSpacing;
    const endMajor = startMajor + (height / viewport.zoom / basePx) + majorSpacing;
    
    const startMinor = Math.floor((-viewport.pan.y / viewport.zoom) / basePx / minorSpacing) * minorSpacing;
    const endMinor = startMinor + (height / viewport.zoom / basePx) + minorSpacing;

    // First render minor ticks
    for (let meters = startMinor; meters <= endMinor; meters += minorSpacing) {
      // Skip if this position will be a major tick
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue;
      
      const canvasY = meters * basePx;
      const screenY = (canvasY * viewport.zoom) + viewport.pan.y;
      
      if (screenY >= 0 && screenY <= height) {
        elements.push(
          <Line
            key={`v-minor-${meters}`}
            points={[rulerSize - 10, screenY, rulerSize, screenY]}
            stroke="#666"
            strokeWidth={0.5}
          />
        );
      }
    }

    // Then render major ticks with labels
    for (let meters = startMajor; meters <= endMajor; meters += majorSpacing) {
      const canvasY = meters * basePx;
      const screenY = (canvasY * viewport.zoom) + viewport.pan.y;
      
      if (screenY >= 0 && screenY <= height) {
        // Major tick line
        elements.push(
          <Line
            key={`v-major-${meters}`}
            points={[rulerSize - 20, screenY, rulerSize, screenY]}
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
        points={[0, 0, rulerSize, 0, rulerSize, rulerSize, 0, rulerSize]}
        fill="#e8e8e8"
        stroke="#d0d0d0"
        strokeWidth={1}
        closed={true}
      />
    </>
  );
}