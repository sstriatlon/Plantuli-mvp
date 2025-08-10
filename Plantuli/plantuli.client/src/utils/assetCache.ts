/**
 * Sistema de cache inteligente para assets de plantas
 * Implementa cache en memoria + persistente con prioridades dinámicas
 */

export interface AssetCacheEntry {
  url: string;
  data: string | HTMLImageElement;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  compressed?: boolean;
}

export interface UsageStats {
  plantId: string;
  accessCount: number;
  lastAccessed: number;
  avgViewTime: number;
  category: string;
}

export interface CacheMetrics {
  hitRate: number;
  avgLoadTime: number;
  memoryUsage: number;
  evictionRate: number;
  totalRequests: number;
  cacheHits: number;
  assetUtilization: Map<string, number>;
}

export interface CacheConfig {
  maxMemoryMB: number;
  maxAge: number;
  preloadDistance: number;
  compressionThreshold: number;
  persistentCacheEnabled: boolean;
}

class AssetCacheManager {
  private cache = new Map<string, AssetCacheEntry>();
  private usageStats = new Map<string, UsageStats>();
  private metrics: CacheMetrics;
  private config: CacheConfig;
  private currentSize = 0;
  private evictionCount = 0;
  private observers = new Map<string, IntersectionObserver>();

  constructor() {
    this.metrics = {
      hitRate: 0,
      avgLoadTime: 0,
      memoryUsage: 0,
      evictionRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      assetUtilization: new Map()
    };

    this.config = this.getAdaptiveConfig();
    this.loadUsageStats();
    this.setupPersistentCache();
  }

  /**
   * Configuración adaptativa según capabilities del device
   */
  private getAdaptiveConfig(): CacheConfig {
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
      maxMemoryMB: memory > 4 ? 50 : memory > 2 ? 25 : 15,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      preloadDistance: connection?.effectiveType === 'slow-2g' ? 100 : 
                      connection?.effectiveType === '2g' ? 200 : 300,
      compressionThreshold: isMobile ? 5 * 1024 : 10 * 1024, // 5KB móvil, 10KB desktop
      persistentCacheEnabled: 'caches' in window && 'serviceWorker' in navigator
    };
  }

  /**
   * Setup del cache persistente usando Cache Storage API
   */
  private async setupPersistentCache(): Promise<void> {
    if (!this.config.persistentCacheEnabled) return;

    try {
      const cache = await caches.open('plantuli-assets-v1');
      console.log('✅ Cache persistente inicializado');
      
      // Precargar assets críticos en background
      this.preloadCriticalAssets();
    } catch (error) {
      console.warn('⚠️ No se pudo inicializar cache persistente:', error);
    }
  }

  /**
   * Obtener asset con cache inteligente
   */
  async get(url: string, priority: AssetCacheEntry['priority'] = 'medium'): Promise<string | HTMLImageElement | null> {
    this.metrics.totalRequests++;
    const startTime = performance.now();

    // 1. Verificar cache en memoria
    const cached = this.cache.get(url);
    if (cached && !this.isExpired(cached)) {
      this.updateAccessStats(cached);
      this.metrics.cacheHits++;
      this.updateMetrics(performance.now() - startTime, true);
      return cached.data;
    }

    // 2. Verificar cache persistente
    if (this.config.persistentCacheEnabled) {
      const persistentData = await this.getFromPersistentCache(url);
      if (persistentData) {
        await this.set(url, persistentData, priority);
        this.updateMetrics(performance.now() - startTime, true);
        return persistentData;
      }
    }

    // 3. Cache miss - load from network
    try {
      const data = await this.loadFromNetwork(url);
      if (data) {
        await this.set(url, data, priority);
        this.updateMetrics(performance.now() - startTime, false);
        return data;
      }
    } catch (error) {
      console.warn(`❌ Error loading asset ${url}:`, error);
    }

    this.updateMetrics(performance.now() - startTime, false);
    return null;
  }

  /**
   * Almacenar en cache con gestión inteligente de memoria
   */
  async set(url: string, data: string | HTMLImageElement, priority: AssetCacheEntry['priority']): Promise<void> {
    const size = this.calculateSize(data);
    const now = Date.now();

    const entry: AssetCacheEntry = {
      url,
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size,
      priority,
      compressed: false
    };

    // Verificar si necesitamos liberar memoria
    if (this.currentSize + size > this.config.maxMemoryMB * 1024 * 1024) {
      await this.evictAssets(size);
    }

    // Comprimir si es necesario
    if (size > this.config.compressionThreshold && typeof data === 'string') {
      entry.data = this.compressSVG(data);
      entry.compressed = true;
      entry.size = this.calculateSize(entry.data);
    }

    this.cache.set(url, entry);
    this.currentSize += entry.size;

    // Guardar en cache persistente
    if (this.config.persistentCacheEnabled && priority !== 'low') {
      this.saveToPersistentCache(url, entry.data);
    }

    this.updateUtilizationStats(url);
  }

  /**
   * Preload inteligente basado en proximidad visual
   */
  setupViewportObserver(containerSelector: string = '.plant-catalog'): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const plantId = (entry.target as HTMLElement).dataset.plantId;
          if (!plantId) return;

          if (entry.isIntersecting) {
            // Preload inmediato para elementos visibles
            this.preloadPlantAssets(plantId, 'high');
          } else if (entry.intersectionRatio > 0) {
            // Preload con prioridad media para elementos parcialmente visibles
            this.preloadPlantAssets(plantId, 'medium');
          }
        });
      },
      {
        root: container,
        rootMargin: `${this.config.preloadDistance}px`,
        threshold: [0, 0.1, 0.5, 1.0]
      }
    );

    // Observar todos los elementos de plantas
    const plantElements = container.querySelectorAll('[data-plant-id]');
    plantElements.forEach(element => observer.observe(element));

    this.observers.set(containerSelector, observer);
  }

  /**
   * Preload de assets de una planta específica
   */
  private async preloadPlantAssets(plantId: string, priority: AssetCacheEntry['priority']): Promise<void> {
    const { getPlantAssets } = await import('./plantAssets');
    const assets = getPlantAssets(plantId);

    // Preload en orden de prioridad: icon -> thumbnail -> sprite
    const loadOrder = [
      { url: assets.icon, priority: priority === 'high' ? 'critical' : priority },
      { url: assets.thumbnail, priority },
      { url: assets.sprite, priority: priority === 'high' ? priority : 'medium' }
    ];

    // Load con delay para no saturar la red
    for (let i = 0; i < loadOrder.length; i++) {
      const { url, priority: assetPriority } = loadOrder[i];
      
      setTimeout(() => {
        this.get(url, assetPriority);
      }, i * 50); // 50ms entre cada asset
    }

    // Actualizar usage stats
    this.updateUsageStats(plantId);
  }

  /**
   * Preload de assets críticos en background
   */
  private async preloadCriticalAssets(): Promise<void> {
    try {
      const { mockPlants } = await import('../data/mockPlants');
      
      // Obtener las 5 plantas más populares o críticas
      const criticalPlants = this.getCriticalPlants(mockPlants.slice(0, 5));
      
      for (const plant of criticalPlants) {
        await this.preloadPlantAssets(plant.id, 'critical');
      }
    } catch (error) {
      console.warn('⚠️ Error preloading critical assets:', error);
    }
  }

  /**
   * Algoritmo de eviction inteligente (LRU + Priority)
   */
  private async evictAssets(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let freedSpace = 0;

    // Ordenar por prioridad y último acceso
    entries.sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a[1].lastAccessed - b[1].lastAccessed; // LRU
    });

    for (const [url, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      // No evict critical assets o assets recién accedidos
      if (entry.priority === 'critical' || 
          Date.now() - entry.lastAccessed < 60000) continue;

      this.cache.delete(url);
      this.currentSize -= entry.size;
      freedSpace += entry.size;
      this.evictionCount++;
    }

    console.log(`🗑️ Evicted ${freedSpace} bytes from cache`);
  }

  /**
   * Compresión básica de SVG
   */
  private compressSVG(svg: string): string {
    return svg
      .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios
      .replace(/\s+/g, ' ') // Comprimir espacios
      .replace(/>\s+</g, '><') // Remover espacios entre tags
      .replace(/(\d+\.\d{2})\d+/g, '$1') // Redondear decimales a 2 lugares
      .trim();
  }

  /**
   * Utilities y helpers
   */
  private calculateSize(data: string | HTMLImageElement): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return data.src.length * 2; // Estimación para HTMLImageElement
  }

  private isExpired(entry: AssetCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.maxAge;
  }

  private updateAccessStats(entry: AssetCacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private updateMetrics(loadTime: number, isHit: boolean): void {
    this.metrics.avgLoadTime = (this.metrics.avgLoadTime + loadTime) / 2;
    this.metrics.hitRate = this.metrics.cacheHits / this.metrics.totalRequests;
    this.metrics.memoryUsage = this.currentSize;
    this.metrics.evictionRate = this.evictionCount / this.metrics.totalRequests;
  }

  private updateUtilizationStats(url: string): void {
    const current = this.metrics.assetUtilization.get(url) || 0;
    this.metrics.assetUtilization.set(url, current + 1);
  }

  private getCriticalPlants(plants: any[]): any[] {
    // Implementar lógica para determinar plantas críticas
    // Por ahora, retornar las primeras 5
    return plants;
  }

  private updateUsageStats(plantId: string): void {
    const stats = this.usageStats.get(plantId) || {
      plantId,
      accessCount: 0,
      lastAccessed: 0,
      avgViewTime: 0,
      category: 'unknown'
    };

    stats.accessCount++;
    stats.lastAccessed = Date.now();
    this.usageStats.set(plantId, stats);
    this.saveUsageStats();
  }

  private loadUsageStats(): void {
    try {
      const stored = localStorage.getItem('plantuli-usage-stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.usageStats = new Map(parsed);
      }
    } catch (error) {
      console.warn('⚠️ Error loading usage stats:', error);
    }
  }

  private saveUsageStats(): void {
    try {
      const serialized = Array.from(this.usageStats.entries());
      localStorage.setItem('plantuli-usage-stats', JSON.stringify(serialized));
    } catch (error) {
      console.warn('⚠️ Error saving usage stats:', error);
    }
  }

  private async loadFromNetwork(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.warn(`Network load failed for ${url}:`, error);
      return null;
    }
  }

  private async getFromPersistentCache(url: string): Promise<string | null> {
    try {
      const cache = await caches.open('plantuli-assets-v1');
      const response = await cache.match(url);
      return response ? await response.text() : null;
    } catch (error) {
      console.warn('Error accessing persistent cache:', error);
      return null;
    }
  }

  private async saveToPersistentCache(url: string, data: string | HTMLImageElement): Promise<void> {
    try {
      const cache = await caches.open('plantuli-assets-v1');
      const response = new Response(typeof data === 'string' ? data : data.src);
      await cache.put(url, response);
    } catch (error) {
      console.warn('Error saving to persistent cache:', error);
    }
  }

  /**
   * API pública para métricas y debugging
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  public getCacheSize(): number {
    return this.currentSize;
  }

  public clearCache(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.evictionCount = 0;
  }

  public getTopAssets(limit: number = 10): Array<{ url: string; usage: number }> {
    return Array.from(this.metrics.assetUtilization.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([url, usage]) => ({ url, usage }));
  }

  /**
   * Cleanup al destruir
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.saveUsageStats();
  }
}

// Singleton instance
export const assetCache = new AssetCacheManager();

// Auto-setup en desarrollo
if (process.env.NODE_ENV === 'development') {
  (window as any).assetCache = assetCache;
  console.log('🚀 Asset Cache Manager inicializado');
}