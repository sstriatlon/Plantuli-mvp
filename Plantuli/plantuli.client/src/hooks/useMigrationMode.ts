import { useState, useEffect } from 'react';
import { getMigrationStats, cleanLegacyData } from '../utils/plantMigration';
import type { Plant } from '../types';

export interface MigrationMode {
  enabled: boolean;
  stats: ReturnType<typeof getMigrationStats>;
  cleanedData: Omit<Plant, 'icon'>[];
}

/**
 * Hook para demostrar el funcionamiento sin dependencia de emojis
 */
export function useMigrationMode(plants: Plant[]): MigrationMode & {
  enableMigrationMode: () => void;
  disableMigrationMode: () => void;
} {
  const [enabled, setEnabled] = useState(false);

  const stats = getMigrationStats(plants);
  const cleanedData = cleanLegacyData(plants);

  useEffect(() => {
    // Auto-enable si ya no hay dependencia de emojis
    if (stats.migrationComplete && stats.validationPassed) {
      console.log('✅ Migration complete! All plants have proper assets.');
    }
  }, [stats]);

  const enableMigrationMode = () => {
    if (stats.validationPassed) {
      setEnabled(true);
      console.log('🚀 Migration mode enabled - running without emoji fallbacks');
    } else {
      console.warn('⚠️ Cannot enable migration mode - some plants lack proper assets');
    }
  };

  const disableMigrationMode = () => {
    setEnabled(false);
    console.log('🔄 Migration mode disabled - emoji fallbacks restored');
  };

  return {
    enabled,
    stats,
    cleanedData,
    enableMigrationMode,
    disableMigrationMode
  };
}