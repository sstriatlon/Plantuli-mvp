import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { PlantCard } from './PlantCard';
import { mockPlants } from '../data/mockPlants';
import { assetCache } from '../utils/assetCache';
import type { Plant } from '../types';

interface PlantCatalogProps {
  onPlantSelect?: (plant: Plant) => void;
  sidebarExpanded?: boolean;
}

export function PlantCatalog({ onPlantSelect, sidebarExpanded = false }: PlantCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Plant['category'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Plant['type'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  const filteredPlants = useMemo(() => {
    return mockPlants.filter(plant => {
      const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || plant.category === categoryFilter;
      const matchesType = typeFilter === 'all' || plant.type === typeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, categoryFilter, typeFilter]);

  // Setup intelligent cache viewport observer
  useEffect(() => {
    if (catalogRef.current) {
      assetCache.setupViewportObserver('.plant-catalog-grid');
    }
    
    return () => {
      // Cleanup will be handled by assetCache.destroy() in App component
    };
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Catálogo de Plantas
        </h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {filteredPlants.length} plantas
        </span>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar plantas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
        />
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200
            ${showFilters 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-white/60 text-slate-600 border border-gray-200/50 hover:bg-white hover:shadow-sm'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {[searchTerm, categoryFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </div>
          <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showFilters && (
          <div className="space-y-3 p-3 bg-white/40 rounded-lg border border-gray-200/50">
            {/* Filtro por categoría */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Exposición solar
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'Todas', icon: '🌐' },
                  { value: 'sun', label: 'Sol', icon: '☀️' },
                  { value: 'partial', label: 'Parcial', icon: '⛅' },
                  { value: 'shade', label: 'Sombra', icon: '🌙' },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setCategoryFilter(value as Plant['category'] | 'all')}
                    className={`
                      px-2 py-1.5 text-xs rounded-md transition-all flex items-center gap-1
                      ${value === categoryFilter
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                      }
                    `}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Tipo de planta
              </label>
              <div className={`grid gap-2 ${sidebarExpanded ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'flower', label: 'Flores' },
                  { value: 'tree', label: 'Árboles' },
                  { value: 'shrub', label: 'Arbustos' },
                  { value: 'herb', label: 'Hierbas' },
                  { value: 'vegetable', label: 'Vegetales' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value as Plant['type'] | 'all')}
                    className={`
                      px-2 py-1.5 text-xs rounded-md transition-all
                      ${value === typeFilter
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-600 bg-white/60 hover:bg-white border border-gray-200/50 rounded-lg transition-all"
              >
                <X size={12} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de plantas */}
      <div 
        ref={catalogRef}
        className={`
          plant-catalog-grid grid gap-3 max-h-96 overflow-y-auto
          ${sidebarExpanded ? 'grid-cols-2' : 'grid-cols-1'}
        `}
      >
        {filteredPlants.map(plant => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onClick={onPlantSelect}
          />
        ))}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredPlants.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-sm">No se encontraron plantas</p>
          <p className="text-xs">Intenta ajustar los filtros</p>
        </div>
      )}
    </div>
  );
}