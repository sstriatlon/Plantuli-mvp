import { useEffect, useRef, useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Stage, Layer, Rect, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Rulers } from './Rulers';
import { PlacedPlantCanvas } from './PlacedPlantCanvas';
import { SelectionHighlight } from './SelectionHighlight';
import { GardenCoordinateSystem } from '../utils/coordinateSystem';
import {
    PIXELS_PER_METER,
    CANVAS_WIDTH_METERS,
    CANVAS_HEIGHT_METERS,
    CANVAS_WIDTH_PX,
    CANVAS_HEIGHT_PX,
    ZOOM_WHEEL_SCALE,
    ZOOM_CHANGE_THRESHOLD,
    GRID_TARGET_SPACING,
    GRID_MAJOR_SPACING_VALUES,
    GRID_MINOR_DIVISOR,
    GRID_MAJOR_STROKE_WIDTH,
    GRID_MINOR_STROKE_WIDTH,
    GRID_MAJOR_LINE_OPACITY,
    GRID_MINOR_LINE_OPACITY,
    CANVAS_BORDER_STROKE_WIDTH,
    PINCH_ZOOM_MIN_TOUCHES
} from '../constants';
import type { Viewport, LayerVisibility, PlacedPlant } from '../types';

interface GardenCanvasProps {
  viewport: Viewport;
  showGrid: boolean;
  showRulers: boolean;
  layerVisibility: LayerVisibility;
  placedPlants: PlacedPlant[];
  newlyPlacedPlantId?: string | null;
  selectedPlantId?: string | null;
  draggingPlantId?: string | null;
  onViewportChange: (viewport: Viewport) => void;
  onPlantSelect?: (instanceId: string) => void;
  onPlantDragStart?: (instanceId: string) => void;
  onPlantDragEnd?: (instanceId: string, newPosition: { x: number; y: number }) => void;
  onCanvasPositionChange?: (rect: DOMRect) => void;
}

export function GardenCanvas({ viewport, showGrid, showRulers, layerVisibility, placedPlants, newlyPlacedPlantId, selectedPlantId, draggingPlantId, onViewportChange, onPlantSelect, onPlantDragStart, onPlantDragEnd, onCanvasPositionChange }: GardenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const coordinateSystem = useMemo(() => new GardenCoordinateSystem(), []);

  const { setNodeRef, isOver } = useDroppable({
    id: 'garden-canvas',
    data: {
      type: 'canvas',
    },
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
        // Notify parent about canvas position for coordinate conversion
        onCanvasPositionChange?.(rect);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [onCanvasPositionChange]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    // CRITICAL: If a plant is being dragged, completely ignore zoom
    if (draggingPlantId) {
      e.evt.preventDefault();
      return;
    }
    
    e.evt.preventDefault();
    
    // Para wheel events, proceder directamente con el zoom del mouse
    
    // Mouse wheel zoom existente
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    
    // Get mouse position relative to the stage
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Calculate the mouse position in the coordinate system before zoom
    const mousePointTo = {
      x: (pointer.x - viewport.pan.x) / oldScale,
      y: (pointer.y - viewport.pan.y) / oldScale,
    };

    // Determine new scale with smooth stepping
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * ZOOM_WHEEL_SCALE : oldScale / ZOOM_WHEEL_SCALE;
    
    // Apply zoom limits with smooth clamping
    const clampedScale = Math.max(viewport.bounds.minZoom, Math.min(viewport.bounds.maxZoom, newScale));
    
    // Only update if scale actually changed (prevents unnecessary updates at limits)
    if (Math.abs(clampedScale - oldScale) < ZOOM_CHANGE_THRESHOLD) return;
    
    // Calculate new position to keep the mouse point in the same place
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Update coordinate system scale for real-world measurements
    coordinateSystem.setScale(clampedScale);

    // Update viewport with smooth transition
    onViewportChange({
      ...viewport,
      zoom: clampedScale,
      pan: newPos
    });
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // CRITICAL: If a plant is being dragged, completely ignore Stage mouse events
    if (draggingPlantId) {
      return;
    }
    
    // Only handle primary mouse button (left click)
    if (e.evt.button !== 0) return;
    
    // Check if the event was already handled by a plant
    if ((e.evt as any)._handled) {
      return;
    }
    
    // Don't start pan if clicking on a draggable plant
    const target = e.target;
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Check if we clicked on a plant group (which should be draggable)
    // Enhanced detection to prevent @dnd-kit interference
    if (target.getParent && target.getParent()?.attrs?.draggable) {
      return; // Let the plant handle its own drag
    }
    
    // Also check if target itself is draggable (for direct group clicks)
    if (target.attrs?.draggable) {
      return;
    }
    
    // Additional check: if any plant is selected, be extra careful about starting pan
    if (selectedPlantId) {
      // Only start pan if we're definitely on background
      if (!(e.target === stage || e.target.getLayer?.()?.attrs?.name === 'background')) {
        return;
      }
    }
    
    // If clicking on background layer or stage, clear selection and start pan
    const isBackground = e.target === stage || e.target.getLayer?.()?.attrs?.name === 'background';
    const isBackgroundRect = e.target.constructor.name === 'Rect' && e.target.getLayer?.()?.attrs?.name === 'background';
    
    if (isBackground || isBackgroundRect) {
      onPlantSelect?.('');  // Clear selection by passing empty string
    }
    
    if (stage.container()) {
      stage.container().style.cursor = 'grabbing';
    }
    
    const startPos = {
      x: e.evt.clientX - viewport.pan.x,
      y: e.evt.clientY - viewport.pan.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newPos = {
        x: moveEvent.clientX - startPos.x,
        y: moveEvent.clientY - startPos.y
      };

      onViewportChange({
        ...viewport,
        pan: newPos
      });
    };

    const handleMouseUp = () => {
      if (stage && stage.container()) {
        stage.container().style.cursor = 'grab';
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch gestures para móvil
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const getTouchCenter = (touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const getTouchDistance = (touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handlePinchZoom = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length !== PINCH_ZOOM_MIN_TOUCHES) return;

    const touchCenter = getTouchCenter(touches);
    const touchDistance = getTouchDistance(touches);

    if (lastTouchCenter && lastTouchDistance) {
      // Calcular zoom
      const scaleChange = touchDistance / lastTouchDistance;
      const stage = e.target.getStage();
      if (!stage) return;
      
      const oldScale = stage.scaleX();
      let newScale = oldScale * scaleChange;

      // Aplicar límites de zoom
      newScale = Math.max(viewport.bounds.minZoom, Math.min(viewport.bounds.maxZoom, newScale));

      // Calcular nueva posición para mantener el punto central fijo
      const touchPointTo = {
        x: (touchCenter.x - viewport.pan.x) / oldScale,
        y: (touchCenter.y - viewport.pan.y) / oldScale,
      };

      const newPos = {
        x: touchCenter.x - touchPointTo.x * newScale,
        y: touchCenter.y - touchPointTo.y * newScale,
      };

      // Actualizar viewport
      onViewportChange({
        ...viewport,
        zoom: newScale,
        pan: newPos
      });
    }

    setLastTouchCenter(touchCenter);
    setLastTouchDistance(touchDistance);
  };

  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === PINCH_ZOOM_MIN_TOUCHES) {
      setLastTouchCenter(getTouchCenter(touches));
      setLastTouchDistance(getTouchDistance(touches));
    } else {
      setLastTouchCenter(null);
      setLastTouchDistance(null);
    }
  };

  const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length < PINCH_ZOOM_MIN_TOUCHES) {
      setLastTouchCenter(null);
      setLastTouchDistance(null);
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const { width, height } = dimensions;

    // Use same spacing logic as rulers
    const getMajorSpacing = (zoom: number) => {
      const pixelsPerMeter = PIXELS_PER_METER * zoom;
      const metersPerLabel = GRID_TARGET_SPACING / pixelsPerMeter;
      return GRID_MAJOR_SPACING_VALUES.reduce((prev, curr) => 
        Math.abs(curr - metersPerLabel) < Math.abs(prev - metersPerLabel) ? curr : prev
      );
    };

    const majorSpacing = getMajorSpacing(viewport.zoom);
    const minorSpacing = majorSpacing / GRID_MINOR_DIVISOR;

    // Define canvas bounds in real-world coordinates (fixed size)
    const canvasBounds = {
      left: 0,
      top: 0,
      right: CANVAS_WIDTH_METERS,
      bottom: CANVAS_HEIGHT_METERS
    };

    // Calculate visible ranges in real-world meters, limited to canvas bounds
    const viewStartX = Math.max(canvasBounds.left, -viewport.pan.x / viewport.zoom / PIXELS_PER_METER);
    const viewEndX = Math.min(canvasBounds.right, (-viewport.pan.x + width) / viewport.zoom / PIXELS_PER_METER);
    const viewStartY = Math.max(canvasBounds.top, -viewport.pan.y / viewport.zoom / PIXELS_PER_METER);
    const viewEndY = Math.min(canvasBounds.bottom, (-viewport.pan.y + height) / viewport.zoom / PIXELS_PER_METER);

    const startXMajor = Math.max(0, Math.floor(viewStartX / majorSpacing) * majorSpacing);
    const endXMajor = Math.min(canvasBounds.right, Math.ceil(viewEndX / majorSpacing) * majorSpacing);
    
    const startXMinor = Math.max(0, Math.floor(viewStartX / minorSpacing) * minorSpacing);
    const endXMinor = Math.min(canvasBounds.right, Math.ceil(viewEndX / minorSpacing) * minorSpacing);

    const startYMajor = Math.max(0, Math.floor(viewStartY / majorSpacing) * majorSpacing);
    const endYMajor = Math.min(canvasBounds.bottom, Math.ceil(viewEndY / majorSpacing) * majorSpacing);
    
    const startYMinor = Math.max(0, Math.floor(viewStartY / minorSpacing) * minorSpacing);
    const endYMinor = Math.min(canvasBounds.bottom, Math.ceil(viewEndY / minorSpacing) * minorSpacing);

    // Vertical lines - Minor first
    for (let meters = startXMinor; meters <= endXMinor; meters += minorSpacing) {
      const isMajorPosition = Math.abs(meters % majorSpacing) < ZOOM_CHANGE_THRESHOLD;
      if (isMajorPosition) continue; // Skip minor lines that coincide with major
      
      const canvasX = meters * PIXELS_PER_METER;
      if (meters >= canvasBounds.left && meters <= canvasBounds.right) {
        lines.push(
          <Line
            key={`v-minor-${meters}`}
            points={[canvasX, canvasBounds.top * PIXELS_PER_METER, canvasX, canvasBounds.bottom * PIXELS_PER_METER]}
            stroke="#c0c0c0ff"
            strokeWidth={GRID_MINOR_STROKE_WIDTH / viewport.zoom}
            opacity={GRID_MINOR_LINE_OPACITY}
          />
        );
      }
    }

    // Vertical lines - Major
    for (let meters = startXMajor; meters <= endXMajor; meters += majorSpacing) {
      const canvasX = meters * PIXELS_PER_METER;
      if (meters >= canvasBounds.left && meters <= canvasBounds.right) {
        lines.push(
          <Line
            key={`v-major-${meters}`}
            points={[canvasX, canvasBounds.top * PIXELS_PER_METER, canvasX, canvasBounds.bottom * PIXELS_PER_METER]}
            stroke="#b9b9b9ff"
            strokeWidth={GRID_MAJOR_STROKE_WIDTH / viewport.zoom}
            opacity={GRID_MAJOR_LINE_OPACITY}
          />
        );
      }
    }

    // Horizontal lines - Minor first
    for (let meters = startYMinor; meters <= endYMinor; meters += minorSpacing) {
      const isMajorPosition = Math.abs(meters % majorSpacing) < ZOOM_CHANGE_THRESHOLD;
      if (isMajorPosition) continue; // Skip minor lines that coincide with major
      
      const canvasY = meters * PIXELS_PER_METER;
      if (meters >= canvasBounds.top && meters <= canvasBounds.bottom) {
        lines.push(
          <Line
            key={`h-minor-${meters}`}
            points={[canvasBounds.left * PIXELS_PER_METER, canvasY, canvasBounds.right * PIXELS_PER_METER, canvasY]}
            stroke="#c0c0c0ff"
            strokeWidth={GRID_MINOR_STROKE_WIDTH / viewport.zoom}
            opacity={GRID_MINOR_LINE_OPACITY}
          />
        );
      }
    }

    // Horizontal lines - Major
    for (let meters = startYMajor; meters <= endYMajor; meters += majorSpacing) {
      const canvasY = meters * PIXELS_PER_METER;
      if (meters >= canvasBounds.top && meters <= canvasBounds.bottom) {
        lines.push(
          <Line
            key={`h-major-${meters}`}
            points={[canvasBounds.left * PIXELS_PER_METER, canvasY, canvasBounds.right * PIXELS_PER_METER, canvasY]}
            stroke="#b9b9b9ff"
            strokeWidth={GRID_MAJOR_STROKE_WIDTH / viewport.zoom}
            opacity={GRID_MAJOR_LINE_OPACITY}
          />
        );
      }
    }

    return lines;
  };

  return (
    <div 
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className={`
        w-full h-full bg-green-50 transition-all duration-200
        ${isOver ? 'bg-green-100 ring-2 ring-green-400 ring-inset cursor-copy' : 'cursor-default'}
      `}
      style={{ width: '100%', height: '100vh' }}
    >
      <Stage 
        width={dimensions.width} 
        height={dimensions.height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.pan.x}
        y={viewport.pan.y}
        onWheel={draggingPlantId ? undefined : handleWheel}
        onMouseDown={draggingPlantId ? undefined : handleMouseDown}
        onTouchStart={draggingPlantId ? undefined : handleTouchStart}
        onTouchMove={draggingPlantId ? undefined : handlePinchZoom}
        onTouchEnd={draggingPlantId ? undefined : handleTouchEnd}
        style={{ 
          cursor: draggingPlantId ? 'default' : 'grab'
        }}
      >
        {/* Background Layer (z-index 1) */}
        {layerVisibility.background && (
          <Layer name="background">
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH_PX}
              height={CANVAS_HEIGHT_PX}
              fill="#f1f8e9"
              stroke="#b9b9b9ff"
              strokeWidth={CANVAS_BORDER_STROKE_WIDTH / viewport.zoom}
            />
            {renderGrid()}
          </Layer>
        )}

        {/* Plants Layer (z-index 2) */}
        {layerVisibility.plants && (
          <Layer name="plants">
            {placedPlants.map((placedPlant) => (
              <PlacedPlantCanvas
                key={placedPlant.instanceId}
                placedPlant={placedPlant}
                pixelsPerMeter={PIXELS_PER_METER}
                showConfirmationEffect={placedPlant.instanceId === newlyPlacedPlantId}
                onSelect={onPlantSelect}
                onDragStart={onPlantDragStart}
                onDragEnd={onPlantDragEnd}
              />
            ))}
          </Layer>
        )}

        {/* Selection Layer (z-index 3) */}
        {layerVisibility.selection && (
          <Layer name="selection">
            {selectedPlantId && selectedPlantId !== draggingPlantId && (() => {
              const selectedPlant = placedPlants.find(p => p.instanceId === selectedPlantId);
              return selectedPlant ? (
                  <SelectionHighlight
                    placedPlant={selectedPlant}
                    pixelsPerMeter={PIXELS_PER_METER}
                  />
              ) : null;
            })()}
          </Layer>
        )}

        {/* UI Layer (z-index 4) - Fixed position, not affected by zoom/pan */}
        {layerVisibility.ui && (
          <Layer 
            name="ui"
            scaleX={1 / viewport.zoom}
            scaleY={1 / viewport.zoom}
            x={-viewport.pan.x / viewport.zoom}
            y={-viewport.pan.y / viewport.zoom}
          >
            {showRulers && (
              <Rulers
                dimensions={dimensions}
                viewport={viewport}
              />
            )}
          </Layer>
        )}
      </Stage>
    </div>
  );
}