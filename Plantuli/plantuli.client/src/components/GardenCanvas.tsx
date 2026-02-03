import { useEffect, useRef, useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Stage, Layer, Rect, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Rulers } from './Rulers';
import { PlacedPlantCanvas } from './PlacedPlantCanvas';
import { SelectionHighlight } from './SelectionHighlight';
import { GardenCoordinateSystem } from '../utils/coordinateSystem';
import { logger } from '../utils/logger';
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
    const scaleBy = 1.08;
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
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Apply zoom limits with smooth clamping
    const clampedScale = Math.max(viewport.bounds.minZoom, Math.min(viewport.bounds.maxZoom, newScale));
    
    // Only update if scale actually changed (prevents unnecessary updates at limits)
    if (Math.abs(clampedScale - oldScale) < 0.001) return;
    
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
    if (touches.length !== 2) return;

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
    if (touches.length === 2) {
      setLastTouchCenter(getTouchCenter(touches));
      setLastTouchDistance(getTouchDistance(touches));
    } else {
      setLastTouchCenter(null);
      setLastTouchDistance(null);
    }
  };

  const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length < 2) {
      setLastTouchCenter(null);
      setLastTouchDistance(null);
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const { width, height } = dimensions;
    const basePx = 100; // Same as rulers: 100px = 1m at zoom 1x

    // Define fixed canvas size in real-world meters
    const canvasRealSize = {
      width: 10, // 10 metros de ancho
      height: 8   // 8 metros de alto
    };

    // Use same spacing logic as rulers
    const getMajorSpacing = (zoom: number) => {
      const pixelsPerMeter = basePx * zoom;
      const targetSpacing = 100;
      const metersPerLabel = targetSpacing / pixelsPerMeter;
      const majorValues = [0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100];
      return majorValues.reduce((prev, curr) => 
        Math.abs(curr - metersPerLabel) < Math.abs(prev - metersPerLabel) ? curr : prev
      );
    };

    const majorSpacing = getMajorSpacing(viewport.zoom);
    const minorSpacing = majorSpacing / 4; // Minor lines every 1/4 of major spacing

    // Define canvas bounds in real-world coordinates (fixed size)
    const canvasBounds = {
      left: 0,
      top: 0,
      right: canvasRealSize.width,
      bottom: canvasRealSize.height
    };

    // Calculate visible ranges in real-world meters, limited to canvas bounds
    const viewStartX = Math.max(canvasBounds.left, -viewport.pan.x / viewport.zoom / basePx);
    const viewEndX = Math.min(canvasBounds.right, (-viewport.pan.x + width) / viewport.zoom / basePx);
    const viewStartY = Math.max(canvasBounds.top, -viewport.pan.y / viewport.zoom / basePx);
    const viewEndY = Math.min(canvasBounds.bottom, (-viewport.pan.y + height) / viewport.zoom / basePx);

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
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue; // Skip minor lines that coincide with major
      
      const canvasX = meters * basePx;
      if (meters >= canvasBounds.left && meters <= canvasBounds.right) {
        lines.push(
          <Line
            key={`v-minor-${meters}`}
            points={[canvasX, canvasBounds.top * basePx, canvasX, canvasBounds.bottom * basePx]}
            stroke="#c0c0c0ff"
            strokeWidth={0.8 / viewport.zoom}
            opacity={0.45}
          />
        );
      }
    }

    // Vertical lines - Major
    for (let meters = startXMajor; meters <= endXMajor; meters += majorSpacing) {
      const canvasX = meters * basePx;
      if (meters >= canvasBounds.left && meters <= canvasBounds.right) {
        lines.push(
          <Line
            key={`v-major-${meters}`}
            points={[canvasX, canvasBounds.top * basePx, canvasX, canvasBounds.bottom * basePx]}
            stroke="#b9b9b9ff"
            strokeWidth={1.3 / viewport.zoom}
            opacity={0.6}
          />
        );
      }
    }

    // Horizontal lines - Minor first
    for (let meters = startYMinor; meters <= endYMinor; meters += minorSpacing) {
      const isMajorPosition = Math.abs(meters % majorSpacing) < 0.001;
      if (isMajorPosition) continue; // Skip minor lines that coincide with major
      
      const canvasY = meters * basePx;
      if (meters >= canvasBounds.top && meters <= canvasBounds.bottom) {
        lines.push(
          <Line
            key={`h-minor-${meters}`}
            points={[canvasBounds.left * basePx, canvasY, canvasBounds.right * basePx, canvasY]}
            stroke="#c0c0c0ff"
            strokeWidth={0.8 / viewport.zoom}
            opacity={0.45}
          />
        );
      }
    }

    // Horizontal lines - Major
    for (let meters = startYMajor; meters <= endYMajor; meters += majorSpacing) {
      const canvasY = meters * basePx;
      if (meters >= canvasBounds.top && meters <= canvasBounds.bottom) {
        lines.push(
          <Line
            key={`h-major-${meters}`}
            points={[canvasBounds.left * basePx, canvasY, canvasBounds.right * basePx, canvasY]}
            stroke="#b9b9b9ff"
            strokeWidth={1.3 / viewport.zoom}
            opacity={0.6}
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
              width={10 * 100} // 10 metros * 100px/metro = 1000px a zoom 1x
              height={8 * 100} // 8 metros * 100px/metro = 800px a zoom 1x
              fill="#f1f8e9"
              stroke="#b9b9b9ff"
              strokeWidth={1.3 / viewport.zoom}
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
                pixelsPerMeter={100}
                showConfirmationEffect={placedPlant.instanceId === newlyPlacedPlantId}
                isSelected={placedPlant.instanceId === selectedPlantId}
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
                  pixelsPerMeter={100}
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