export interface Position {
  x: number;
  y: number;
}

export interface Plant {
  id: string;
  name: string;
  type: 'flower' | 'shrub' | 'tree' | 'herb' | 'vegetable';
  category: 'sun' | 'shade' | 'partial';
  size: {
    width: number;
    height: number;
  };
  color: string;
  icon?: string; // Emoji fallback opcional - deprecated, usar assets
  assets: { // Ahora requerido
    icon: string;      // Ruta a ícono para sidebar
    sprite: string;    // Ruta a sprite para canvas
    thumbnail: string; // Ruta a thumbnail
  };
  description?: string;
  growthTime?: number;
  spacing?: number;
}

export interface PlacedPlant {
  instanceId: string;
  plant: Plant;
  position: Position;
  rotation: number;
  scale: number;
  placedAt: Date;
}

export interface Viewport {
  zoom: number;
  pan: Position;
  bounds: {
    minZoom: number;
    maxZoom: number;
  };
}

export type Tool = 'select' | 'add' | 'delete' | 'pan';

export interface LayerVisibility {
  background: boolean;
  plants: boolean;
  selection: boolean;
  ui: boolean;
}

export interface AppState {
  placedPlants: PlacedPlant[];
  selectedPlantId: string | null;
  activeTool: Tool;
  viewport: Viewport;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layerVisibility: LayerVisibility;
}

// Drag & Drop types
export interface DragItem {
  type: 'plant';
  plant: Plant;
}

export interface DropResult {
  success: boolean;
  position?: Position;
  snapPosition?: Position;
}