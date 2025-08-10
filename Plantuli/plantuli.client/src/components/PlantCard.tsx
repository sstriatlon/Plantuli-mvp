import { useDraggable } from '@dnd-kit/core';
import type { Plant } from '../types';
import { PlantImage } from './PlantImage';

interface PlantCardProps {
  plant: Plant;
  onClick?: (plant: Plant) => void;
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `plant-${plant.id}`,
    data: {
      type: 'plant',
      plant,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getCategoryColor = (category: Plant['category']) => {
    switch (category) {
      case 'sun': return 'from-yellow-400 to-orange-400';
      case 'shade': return 'from-blue-400 to-indigo-400';
      case 'partial': return 'from-green-400 to-teal-400';
      default: return 'from-gray-400 to-slate-400';
    }
  };

  const getCategoryIcon = (category: Plant['category']) => {
    switch (category) {
      case 'sun': return '☀️';
      case 'shade': return '🌙';
      case 'partial': return '⛅';
      default: return '❓';
    }
  };

  const getTypeColor = (type: Plant['type']) => {
    switch (type) {
      case 'flower': return 'text-pink-600 bg-pink-100';
      case 'tree': return 'text-green-700 bg-green-100';
      case 'shrub': return 'text-green-600 bg-green-100';
      case 'herb': return 'text-emerald-600 bg-emerald-100';
      case 'vegetable': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative">
      {/* Completely transparent drag element */}
      <div
        ref={setNodeRef}
        style={style}
        className="absolute inset-0 z-10 opacity-0"
        {...listeners}
        {...attributes}
        draggable={false}
      >
        {/* Single transparent pixel to avoid native preview */}
        <div className="w-px h-px bg-transparent" />
      </div>
      
      {/* Visible card */}
      <div
        className={`
          relative bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 group 
          ${isDragging 
            ? 'opacity-20 shadow-xl border-green-400 cursor-grabbing transform scale-95' 
            : 'hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 cursor-grab'
          }
        `}
        onClick={() => onClick?.(plant)}
      >
      {/* Header con ícono y categoría */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <PlantImage 
                plant={plant} 
                variant="icon" 
                className="w-full h-full object-contain"
                fallbackClassName="text-2xl"
              />
            </div>
            <div className={`
              text-xs px-2 py-1 rounded-full font-medium
              bg-gradient-to-r ${getCategoryColor(plant.category)} text-white
            `}>
              {getCategoryIcon(plant.category)} {plant.category}
            </div>
          </div>
        </div>

        {/* Nombre de la planta */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
          {plant.name}
        </h3>
        
        {/* Tipo */}
        <div className={`
          inline-block text-xs px-2 py-1 rounded-md font-medium mt-1
          ${getTypeColor(plant.type)}
        `}>
          {plant.type === 'flower' && 'Flor'}
          {plant.type === 'tree' && 'Árbol'}
          {plant.type === 'shrub' && 'Arbusto'}
          {plant.type === 'herb' && 'Hierba'}
          {plant.type === 'vegetable' && 'Vegetal'}
        </div>
      </div>

      {/* Información de tamaño */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Tamaño:</span>
            <span className="font-medium text-gray-700">
              {plant.size.width}m × {plant.size.height}m
            </span>
          </div>
          {plant.spacing && (
            <div className="flex justify-between">
              <span>Espaciado:</span>
              <span className="font-medium text-gray-700">{plant.spacing}m</span>
            </div>
          )}
        </div>
      </div>

      {/* Descripción (tooltip en hover) */}
      {plant.description && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 text-center">
          {plant.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      </div>
    </div>
  );
}