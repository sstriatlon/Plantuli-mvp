import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Image } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { logger } from '../../../shared/utils/logger';
import {
    DRAG_MOVEMENT_THRESHOLD,
    QUICK_CLICK_THRESHOLD_MS,
    PLANT_CONFIRMATION_ANIMATION_DURATION,
    PLANT_CONFIRMATION_SCALE,
    PLANT_BACKGROUND_OPACITY,
    PLANT_BACKGROUND_STROKE_WIDTH,
    PLANT_IMAGE_OPACITY,
    PLANT_FALLBACK_OPACITY,
    PLANT_BORDER_OPACITY,
    PLANT_BORDER_STROKE_WIDTH,
    DASH_PATTERN
} from '../../../shared/constants';
import type { PlacedPlant } from '../../../shared/types';

interface PlacedPlantCanvasProps {
  placedPlant: PlacedPlant;
  pixelsPerMeter?: number;
  showConfirmationEffect?: boolean;
  onSelect?: (instanceId: string) => void;
  onDragEnd?: (instanceId: string, newPosition: { x: number; y: number }) => void;
  onDragStart?: (instanceId: string) => void;
}

export function PlacedPlantCanvas({ placedPlant, pixelsPerMeter = 100, showConfirmationEffect = false, onSelect, onDragEnd, onDragStart }: PlacedPlantCanvasProps) {
  const { plant, position, scale } = placedPlant;
  const groupRef = useRef<Konva.Group>(null);
  const [plantImage, setPlantImage] = useState<HTMLImageElement | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  
  // Convert real-world coordinates to canvas pixels
  const canvasX = position.x * pixelsPerMeter;
  const canvasY = position.y * pixelsPerMeter;
  
  // Plant size in pixels
  const radiusX = (plant.size.width * pixelsPerMeter * scale) / 2;
  const radiusY = (plant.size.height * pixelsPerMeter * scale) / 2;

  // Load plant image
  useEffect(() => {
    const loadImage = () => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setPlantImage(img);
      };
      img.onerror = () => {
        logger.warn(`Failed to load plant image: ${plant.assets.sprite}`);
        setPlantImage(null);
      };
      img.src = plant.assets.sprite;
    };

    loadImage();
  }, [plant.assets.sprite]);

  // Confirmation effect animation
  useEffect(() => {
    if (showConfirmationEffect && groupRef.current) {
      // Start with normal scale
      groupRef.current.scale({ x: 1, y: 1 });
      
      // Animate to confirmation scale then back to 1x
      const tween = new Konva.Tween({
        node: groupRef.current,
        duration: PLANT_CONFIRMATION_ANIMATION_DURATION,
        scaleX: PLANT_CONFIRMATION_SCALE,
        scaleY: PLANT_CONFIRMATION_SCALE,
        easing: Konva.Easings.EaseInOut,
        onFinish: () => {
          // Animate back to normal scale
          new Konva.Tween({
            node: groupRef.current!,
            duration: PLANT_CONFIRMATION_ANIMATION_DURATION,
            scaleX: 1,
            scaleY: 1,
            easing: Konva.Easings.EaseInOut,
          }).play();
        }
      });
      
      tween.play();
    }
  }, [showConfirmationEffect]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Stop event propagation to prevent Stage from handling it
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    // Mark the event as handled for Stage
    if (e.evt) {
      (e.evt as any)._handled = true;
    }
    
    // IMMEDIATE SELECTION - select the plant right away on mouse down
    // Always select, even if already selected (to ensure consistent state)
    onSelect?.(placedPlant.instanceId);
    
    // Record drag start time and position for click vs drag detection
    const currentTime = Date.now();
    const stage = e.target.getStage();
    if (stage) {
      setDragStartTime(currentTime);
    }
  };

  const handleDragStart = () => {
    onDragStart?.(placedPlant.instanceId);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Stop event propagation
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    const group = e.target;
    const currentCanvasX = group.x();
    const currentCanvasY = group.y();
    
    // Enhanced click vs drag detection
    const currentTime = Date.now();
    const timeDiff = dragStartTime ? currentTime - dragStartTime : 0;
    
    // Check if plant actually moved from original position
    const deltaX = Math.abs(currentCanvasX - canvasX);
    const deltaY = Math.abs(currentCanvasY - canvasY);
    const actuallyMoved = deltaX > DRAG_MOVEMENT_THRESHOLD || deltaY > DRAG_MOVEMENT_THRESHOLD;
    
    // Additional check: if drag time was very short and minimal movement, treat as click
    const isQuickClick = timeDiff < QUICK_CLICK_THRESHOLD_MS && !actuallyMoved;
    
    if (actuallyMoved && !isQuickClick) {
      // Real drag - update position
      const newRealX = currentCanvasX / pixelsPerMeter;
      const newRealY = currentCanvasY / pixelsPerMeter;
      
      onDragEnd?.(placedPlant.instanceId, { x: newRealX, y: newRealY });
    } else {
      // Just a click - reset position and maintain selection
      group.x(canvasX);
      group.y(canvasY);
      
      // Call onDragEnd with original position to clear dragging state
      onDragEnd?.(placedPlant.instanceId, { x: position.x, y: position.y });
    }
    
    // Reset tracking variables
    setDragStartTime(null);
  };

  return (
    <Group
      ref={groupRef}
      x={canvasX}
      y={canvasY}
      draggable={true}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Plant background circle */}
      <Circle
        x={0}
        y={0}
        radiusX={radiusX}
        radiusY={radiusY}
        fill={plant.color}
        stroke={plant.color}
        strokeWidth={PLANT_BACKGROUND_STROKE_WIDTH}
        opacity={PLANT_BACKGROUND_OPACITY}
      />
      
      {/* Plant image */}
      {plantImage && (
        <Image
          x={-radiusX}
          y={-radiusY}
          width={radiusX * 2}
          height={radiusY * 2}
          image={plantImage}
          opacity={PLANT_IMAGE_OPACITY}
        />
      )}
      
      {/* Fallback if image doesn't load - show plant emoji/icon */}
      {!plantImage && plant.icon && (
        <Circle
          x={0}
          y={0}
          radius={Math.min(radiusX, radiusY)}
          fill={plant.color}
          opacity={PLANT_FALLBACK_OPACITY}
        />
      )}
      
      {/* Plant border for definition */}
      <Circle
        x={0}
        y={0}
        radiusX={radiusX}
        radiusY={radiusY}
        fill="transparent"
        stroke={plant.color}
        strokeWidth={PLANT_BORDER_STROKE_WIDTH}
        opacity={PLANT_BORDER_OPACITY}
        dash={DASH_PATTERN}
      />
    </Group>
  );
}