import { useState, useEffect } from 'react';
import { assetCache, type CacheMetrics } from '../utils/assetCache';

export function useAssetCacheMetrics(updateInterval: number = 5000) {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Only enable in development or when explicitly requested
    const shouldEnable = process.env.NODE_ENV === 'development' || 
                        localStorage.getItem('plantuli-debug-cache') === 'true';
    
    setIsEnabled(shouldEnable);
    
    if (!shouldEnable) return;

    const updateMetrics = () => {
      setMetrics(assetCache.getMetrics());
    };

    // Initial load
    updateMetrics();

    // Set up interval for live updates
    const interval = setInterval(updateMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const enableDebug = () => {
    localStorage.setItem('plantuli-debug-cache', 'true');
    setIsEnabled(true);
  };

  const disableDebug = () => {
    localStorage.removeItem('plantuli-debug-cache');
    setIsEnabled(false);
  };

  return {
    metrics: isEnabled ? metrics : null,
    isEnabled,
    enableDebug,
    disableDebug,
    cacheSize: metrics ? assetCache.getCacheSize() : 0,
    topAssets: metrics ? assetCache.getTopAssets(5) : []
  };
}