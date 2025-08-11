import type { Plant } from '../types';
import { getPlantAssets } from './plantAssets';

/**
 * Migra plantas del formato legacy (con emojis) al nuevo formato (assets-only)
 */
export const migratePlantData = (legacyPlants: any[]): Plant[] => {
  return legacyPlants.map(plant => {
    // Asegurar que todos los campos required están presentes
    const migratedPlant: Plant = {
      id: plant.id,
      name: plant.name,
      type: plant.type,
      category: plant.category,
      size: plant.size,
      color: plant.color,
      assets: plant.assets || getPlantAssets(plant.id),
      // Campos opcionales
      ...(plant.description && { description: plant.description }),
      ...(plant.growthTime && { growthTime: plant.growthTime }),
      ...(plant.spacing && { spacing: plant.spacing }),
      // Emoji solo como fallback temporal durante desarrollo
      ...(process.env.NODE_ENV === 'development' && plant.icon && { icon: plant.icon })
    };

    return migratedPlant;
  });
};

/**
 * Valida que una planta tiene todos los assets necesarios
 */
export const validatePlantAssets = (plant: Plant): boolean => {
  return !!(
    plant.assets &&
    plant.assets.icon &&
    plant.assets.sprite &&
    plant.assets.thumbnail &&
    plant.id &&
    plant.name &&
    plant.type &&
    plant.category &&
    plant.size &&
    plant.color
  );
};

/**
 * Genera estadísticas de migración
 */
export const getMigrationStats = (plants: Plant[]) => {
  const total = plants.length;
  const withAssets = plants.filter(plant => plant.assets).length;
  const withEmojis = plants.filter(plant => plant.icon).length;
  const fullValid = plants.filter(validatePlantAssets).length;

  return {
    total,
    withAssets,
    withEmojis,
    fullValid,
    migrationComplete: withAssets === total,
    validationPassed: fullValid === total,
    assetCoverage: (withAssets / total) * 100,
    validationRate: (fullValid / total) * 100
  };
};

/**
 * Limpia datos legacy removiendo campos deprecated
 */
export const cleanLegacyData = (plants: Plant[]): Omit<Plant, 'icon'>[] => {
  return plants.map(plant => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { icon, ...cleanPlant } = plant;
    return cleanPlant;
  });
};