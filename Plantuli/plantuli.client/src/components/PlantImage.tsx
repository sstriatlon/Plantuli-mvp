import { useState, useEffect, useRef } from 'react';
import type { Plant } from '../types';
import { assetCache } from '../utils/assetCache';
import { logger } from '../utils/logger';

interface PlantImageProps {
  plant: Plant;
  variant: 'icon' | 'sprite' | 'thumbnail';
  className?: string;
  fallbackClassName?: string;
  lazy?: boolean; // Enable intersection observer lazy loading
  priority?: boolean; // Disable lazy loading for critical images
}

export function PlantImage({ 
  plant, 
  variant, 
  className = "w-full h-full object-contain",
  fallbackClassName = "text-2xl",
  lazy = true,
  priority = false
}: PlantImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
  const [cachedData, setCachedData] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '200px', // Increased for intelligent preloading
        threshold: 0.1 
      }
    );

    if (containerRef.current) {
      // Add plant-id data attribute for cache preloading
      containerRef.current.dataset.plantId = plant.id;
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, shouldLoad, plant.id]);

  // Load asset from intelligent cache when shouldLoad becomes true
  useEffect(() => {
    if (!shouldLoad || !plant.assets?.[variant]) return;

    const loadAsset = async () => {
      try {
        const assetPriority = priority ? 'critical' : 
                            variant === 'icon' ? 'high' : 
                            variant === 'thumbnail' ? 'medium' : 'low';

        const data = await assetCache.get(plant.assets[variant], assetPriority);
        
        if (data && typeof data === 'string') {
          // Convert SVG string to data URL for img src
          const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
          const dataUrl = URL.createObjectURL(svgBlob);
          setCachedData(dataUrl);
        } else if (!data) {
          // Cache miss and network failed, show fallback
          setImageError(true);
        }
      } catch (error) {
        logger.warn(`Failed to load ${variant} for ${plant.name}:`, error);
        setImageError(true);
      }
    };

    loadAsset();
  }, [shouldLoad, plant.assets, plant.name, variant, priority]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (cachedData) {
        URL.revokeObjectURL(cachedData);
      }
    };
  }, [cachedData]);

  // Si hay error o no se puede cargar el asset, usar emoji como último fallback
  if (imageError || !plant.assets?.[variant]) {
    return (
      <div ref={containerRef} className="flex items-center justify-center">
        <span className={fallbackClassName}>
          {plant.icon || '🌱'} {/* Fallback genérico si no hay emoji */}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Emoji como loading state si está disponible */}
      {!imageLoaded && plant.icon && (
        <span className={`${fallbackClassName} absolute inset-0 flex items-center justify-center z-10`}>
          {plant.icon}
        </span>
      )}
      
      {/* Imagen real - solo se carga cuando shouldLoad es true y tenemos datos cached */}
      {shouldLoad && cachedData && (
        <img 
          ref={imgRef}
          src={cachedData}
          alt={plant.name}
          className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            // Cleanup object URL on error
            URL.revokeObjectURL(cachedData);
            setImageError(true);
          }}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
}