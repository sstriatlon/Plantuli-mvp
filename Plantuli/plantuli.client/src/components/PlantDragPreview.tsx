import type { Plant } from '../types';
import { PlantImage } from './PlantImage';

interface PlantDragPreviewProps {
  plant: Plant;
}

export function PlantDragPreview({ plant }: PlantDragPreviewProps) {
  // Convert plant size to pixels (1m = 100px at zoom 1x, like in canvas)
  const pixelsPerMeter = 100;
  const widthPx = plant.size.width * pixelsPerMeter;
  const heightPx = plant.size.height * pixelsPerMeter;
  
  // Scale down for preview while maintaining aspect ratio
  const maxPreviewSize = 120; // Max size in pixels for preview
  const scale = Math.min(maxPreviewSize / widthPx, maxPreviewSize / heightPx, 1);
  const previewWidth = widthPx * scale;
  const previewHeight = heightPx * scale;

  return (
    <div 
      className="pointer-events-none relative bg-green-100 border-2 border-green-400 border-dashed rounded-full opacity-80 flex items-center justify-center shadow-lg"
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        minWidth: '40px',
        minHeight: '40px',
      }}
    >
      {/* Plant sprite/visual */}
      <PlantImage 
        plant={plant} 
        variant="sprite" 
        className="w-full h-full object-contain"
        fallbackClassName="text-xl"
      />

      {/* Plant circle outline (like it will appear in canvas) */}
      <div 
        className="absolute inset-0 border-2 border-green-600 border-opacity-50 rounded-full"
        style={{
          background: `radial-gradient(circle, ${plant.color}20 0%, ${plant.color}10 70%, transparent 100%)`
        }}
      />
    </div>
  );
}