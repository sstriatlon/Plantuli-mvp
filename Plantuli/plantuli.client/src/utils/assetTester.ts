import type { Plant } from '../types';
import { hasPlantAssets } from './plantAssets';

interface AssetTestResult {
  plantId: string;
  hasAssets: boolean;
  results: {
    icon: boolean;
    sprite: boolean;
    thumbnail: boolean;
  };
  errors: string[];
}

/**
 * Testa la disponibilidad de assets para una planta específica
 */
export const testPlantAssets = async (plant: Plant): Promise<AssetTestResult> => {
  const result: AssetTestResult = {
    plantId: plant.id,
    hasAssets: hasPlantAssets(plant),
    results: {
      icon: false,
      sprite: false,
      thumbnail: false
    },
    errors: []
  };

  if (!plant.assets) {
    result.errors.push('No assets configuration found');
    return result;
  }

  // Test each asset type
  const assetTests = [
    { type: 'icon' as const, url: plant.assets.icon },
    { type: 'sprite' as const, url: plant.assets.sprite },
    { type: 'thumbnail' as const, url: plant.assets.thumbnail }
  ];

  const testPromises = assetTests.map(async ({ type, url }) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const success = response.ok;
      result.results[type] = success;
      
      if (!success) {
        result.errors.push(`${type}: HTTP ${response.status} - ${url}`);
      }
      
      return success;
    } catch (error) {
      result.results[type] = false;
      result.errors.push(`${type}: ${error instanceof Error ? error.message : 'Unknown error'} - ${url}`);
      return false;
    }
  });

  await Promise.all(testPromises);

  return result;
};

/**
 * Testa todos los assets de un array de plantas
 */
export const testAllPlantAssets = async (plants: Plant[]): Promise<AssetTestResult[]> => {
  if (!plants || !Array.isArray(plants)) {
    console.warn('Invalid plants array provided to testAllPlantAssets');
    return [];
  }
  
  const plantsWithAssets = plants.filter(hasPlantAssets);
  
  console.log(`Testing assets for ${plantsWithAssets.length} plants...`);
  
  const results = await Promise.all(
    plantsWithAssets.map(plant => testPlantAssets(plant))
  );

  // Log summary
  const successful = results.filter(r => 
    r.results.icon && r.results.sprite && r.results.thumbnail
  ).length;
  
  const partial = results.filter(r => 
    (r.results.icon || r.results.sprite || r.results.thumbnail) &&
    !(r.results.icon && r.results.sprite && r.results.thumbnail)
  ).length;
  
  const failed = results.filter(r => 
    !r.results.icon && !r.results.sprite && !r.results.thumbnail
  ).length;

  console.log(`Asset Test Results:`);
  console.log(`✅ Fully working: ${successful}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);

  // Log detailed errors
  results.forEach(result => {
    if (result.errors.length > 0) {
      console.warn(`Issues with ${result.plantId}:`, result.errors);
    }
  });

  return results;
};

/**
 * Función de conveniencia para testing en desarrollo
 */
export const runAssetTest = async (plants?: Plant[]): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Si no se pasan plantas, importar mockPlants
      if (!plants) {
        const { mockPlants } = await import('../data/mockPlants');
        plants = mockPlants;
      }
      
      if (!plants || !Array.isArray(plants) || plants.length === 0) {
        console.warn('⚠️ No plants available for asset testing');
        return;
      }
      
      console.log('🧪 Starting asset tests...');
      await testAllPlantAssets(plants);
    } catch (error) {
      console.error('❌ Asset testing failed:', error);
    }
  }
};