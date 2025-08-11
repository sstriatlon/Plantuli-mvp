import type { Plant } from '../types';
import { assetCache } from './assetCache';

/**
 * Genera las rutas de assets para una planta específica
 */
export const getPlantAssets = (plantId: string) => ({
  icon: `/assets/plants/icons/${plantId}.svg`,
  sprite: `/assets/plants/sprites/${plantId}.svg`,
  thumbnail: `/assets/plants/thumbnails/${plantId}.svg`
});

/**
 * Precarga los assets críticos usando el sistema de cache inteligente
 */
export const preloadPlantAssets = async (plants: Plant[]): Promise<void[]> => {
  const promises = plants
    .filter(plant => plant.assets) // Solo precargar plantas que tienen assets
    .flatMap(plant => [
      assetCache.get(plant.assets!.icon, 'critical'),
      assetCache.get(plant.assets!.sprite, 'high'),
      assetCache.get(plant.assets!.thumbnail, 'medium')
    ]);
  
  return Promise.all(promises).then(() => []);
};


/**
 * Verifica si una planta tiene assets disponibles
 */
export const hasPlantAssets = (plant: Plant): boolean => {
  return !!(plant.assets && plant.assets.icon && plant.assets.sprite && plant.assets.thumbnail);
};

/**
 * Obtiene el display name de una planta con fallback
 */
export const getPlantDisplayIcon = (plant: Plant): string => {
  // Prioridad: assets.icon -> emoji icon -> generic fallback
  if (plant.assets?.icon) {
    return plant.assets.icon;
  }
  return plant.icon || '🌱';
};