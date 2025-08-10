import { useState } from 'react';
import { Activity, Database, Clock, TrendingUp, X, Eye, EyeOff, Zap } from 'lucide-react';
import { useAssetCacheMetrics } from '../hooks/useAssetCacheMetrics';
import { useMigrationMode } from '../hooks/useMigrationMode';
import { mockPlants } from '../data/mockPlants';

export function CacheDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const { metrics, isEnabled, enableDebug, disableDebug, cacheSize, topAssets } = useAssetCacheMetrics();
  const { stats: migrationStats, enabled: migrationEnabled, enableMigrationMode, disableMigrationMode } = useMigrationMode(mockPlants);

  if (!isEnabled && !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
        title="Debug Cache"
      >
        <Database size={16} />
      </button>
    );
  }

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Cache Debug</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Habilita el debug del cache para ver métricas en tiempo real.
        </p>
        <button
          onClick={enableDebug}
          className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
        >
          Habilitar Debug
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity size={16} className="animate-spin" />
          Cargando métricas...
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">Cache Debug</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={disableDebug}
            className="text-gray-400 hover:text-gray-600"
            title="Deshabilitar debug"
          >
            <EyeOff size={14} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            title="Cerrar panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={12} className="text-green-600" />
            <span className="text-xs font-medium text-green-800">Hit Rate</span>
          </div>
          <div className="text-sm font-bold text-green-900">
            {formatPercentage(metrics.hitRate)}
          </div>
        </div>

        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Database size={12} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Memory</span>
          </div>
          <div className="text-sm font-bold text-blue-900">
            {formatBytes(cacheSize)}
          </div>
        </div>

        <div className="p-2 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Clock size={12} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-800">Avg Load</span>
          </div>
          <div className="text-sm font-bold text-purple-900">
            {metrics.avgLoadTime.toFixed(1)}ms
          </div>
        </div>

        <div className="p-2 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Activity size={12} className="text-orange-600" />
            <span className="text-xs font-medium text-orange-800">Requests</span>
          </div>
          <div className="text-sm font-bold text-orange-900">
            {metrics.totalRequests}
          </div>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Cache Hits:</span>
          <span className="font-medium">{metrics.cacheHits}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Cache Misses:</span>
          <span className="font-medium">{metrics.totalRequests - metrics.cacheHits}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Eviction Rate:</span>
          <span className="font-medium">{formatPercentage(metrics.evictionRate)}</span>
        </div>
      </div>

      {/* Top Assets */}
      {topAssets.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Top Assets</h4>
          <div className="space-y-1">
            {topAssets.map(({ url, usage }, index) => (
              <div key={url} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {index + 1}. {url.split('/').pop()?.split('.')[0]}
                </span>
                <span className="font-medium text-gray-800">{usage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migration Status */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <Zap size={12} className="text-purple-500" />
          Asset Migration
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Asset Coverage:</span>
            <span className={`font-medium ${migrationStats.assetCoverage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
              {migrationStats.assetCoverage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Validation:</span>
            <span className={`font-medium ${migrationStats.validationPassed ? 'text-green-600' : 'text-red-600'}`}>
              {migrationStats.validationRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Legacy Emojis:</span>
            <span className="font-medium text-gray-800">{migrationStats.withEmojis}</span>
          </div>
        </div>
        
        {migrationStats.validationPassed && (
          <button
            onClick={migrationEnabled ? disableMigrationMode : enableMigrationMode}
            className={`w-full mt-2 px-2 py-1 text-xs rounded transition-colors ${
              migrationEnabled 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {migrationEnabled ? '⚡ Migration Active' : '🚀 Enable Migration'}
          </button>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Cache Status:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}