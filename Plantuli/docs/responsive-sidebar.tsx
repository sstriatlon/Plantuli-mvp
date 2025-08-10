import React, { useState, useEffect } from 'react';
import { TreePine, Flower, Settings, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const ResponsiveSidebar = () => {
  const [sidebarState, setSidebarState] = useState('normal'); // 'collapsed', 'normal', 'expanded'
  const [screenSize, setScreenSize] = useState('desktop');
  const [isDragging, setIsDragging] = useState(null);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) setScreenSize('mobile');
      else if (window.innerWidth < 1200) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Configuración responsiva de anchos
  const getSidebarWidth = () => {
    if (sidebarState === 'collapsed') return screenSize === 'mobile' ? '60px' : '80px';
    
    switch (screenSize) {
      case 'mobile':
        return sidebarState === 'expanded' ? '90vw' : '280px';
      case 'tablet':
        return sidebarState === 'expanded' ? '400px' : '300px';
      case 'desktop':
        return sidebarState === 'expanded' ? '450px' : '320px';
      default:
        return '320px';
    }
  };

  const plantElements = [
    { id: 'rose', name: 'Rosa', icon: '🌹', category: 'flores' },
    { id: 'oak', name: 'Roble', icon: '🌳', category: 'arboles' },
    { id: 'lavender', name: 'Lavanda', icon: '💜', category: 'hierbas' },
    { id: 'maple', name: 'Arce', icon: '🍁', category: 'arboles' },
    { id: 'tulip', name: 'Tulipán', icon: '🌷', category: 'flores' },
    { id: 'pine', name: 'Pino', icon: '🌲', category: 'arboles' },
  ];

  const handleDragStart = (e, element) => {
    setIsDragging(element.id);
    e.dataTransfer.setData('text/plain', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  const toggleSidebar = () => {
    if (sidebarState === 'collapsed') {
      setSidebarState('normal');
    } else if (sidebarState === 'normal') {
      setSidebarState(screenSize === 'mobile' ? 'collapsed' : 'expanded');
    } else {
      setSidebarState(screenSize === 'mobile' ? 'normal' : 'collapsed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Barra Lateral */}
      <div 
        className={`
          bg-white shadow-lg transition-all duration-300 ease-in-out relative
          ${screenSize === 'mobile' && sidebarState !== 'collapsed' ? 'absolute z-50' : ''}
        `}
        style={{ width: getSidebarWidth() }}
      >
        {/* Header de la barra lateral */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarState !== 'collapsed' && (
            <h2 className="font-semibold text-gray-800">
              {sidebarState === 'expanded' ? 'Biblioteca de Plantas' : 'Plantas'}
            </h2>
          )}
          
          <div className="flex gap-2">
            {sidebarState !== 'collapsed' && sidebarState === 'normal' && screenSize === 'desktop' && (
              <button
                onClick={() => setSidebarState('expanded')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Expandir panel"
              >
                <Maximize2 size={16} />
              </button>
            )}
            
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={sidebarState === 'collapsed' ? 'Expandir' : 'Contraer'}
            >
              {sidebarState === 'collapsed' ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Contenido de la barra lateral */}
        {sidebarState !== 'collapsed' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            {/* Sección de herramientas */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                Herramientas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                  <TreePine size={16} />
                  {sidebarState === 'expanded' && <span className="text-sm">Plantar</span>}
                </button>
                <button className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                  <Settings size={16} />
                  {sidebarState === 'expanded' && <span className="text-sm">Config</span>}
                </button>
              </div>
            </div>

            {/* Biblioteca de plantas */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                Plantas
              </h3>
              
              <div className={`
                grid gap-2
                ${sidebarState === 'expanded' && screenSize === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}
              `}>
                {plantElements.map((plant) => (
                  <div
                    key={plant.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, plant)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-3 p-3 bg-white border-2 border-gray-200 
                      rounded-lg cursor-grab active:cursor-grabbing
                      hover:border-green-300 hover:shadow-sm transition-all
                      ${isDragging === plant.id ? 'opacity-50 scale-95' : ''}
                      ${screenSize === 'mobile' ? 'touch-manipulation' : ''}
                    `}
                  >
                    <span className="text-2xl">{plant.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {plant.name}
                      </div>
                      {sidebarState === 'expanded' && (
                        <div className="text-xs text-gray-500 capitalize">
                          {plant.category}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración del jardín (solo modo expandido) */}
            {sidebarState === 'expanded' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Configuración
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Estación del año
                    </label>
                    <select className="w-full p-2 border border-gray-200 rounded text-sm">
                      <option>Primavera</option>
                      <option>Verano</option>
                      <option>Otoño</option>
                      <option>Invierno</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Tipo de suelo
                    </label>
                    <select className="w-full p-2 border border-gray-200 rounded text-sm">
                      <option>Arcilloso</option>
                      <option>Arenoso</option>
                      <option>Franco</option>
                      <option>Limoso</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista colapsada - iconos solamente */}
        {sidebarState === 'collapsed' && (
          <div className="p-2 space-y-2">
            <button className="w-full p-3 hover:bg-gray-100 rounded transition-colors" title="Herramientas">
              <TreePine size={20} className="mx-auto" />
            </button>
            <button className="w-full p-3 hover:bg-gray-100 rounded transition-colors" title="Configuración">
              <Settings size={20} className="mx-auto" />
            </button>
            <div className="border-t border-gray-200 my-2"></div>
            {plantElements.slice(0, 4).map((plant) => (
              <div
                key={plant.id}
                draggable
                onDragStart={(e) => handleDragStart(e, plant)}
                onDragEnd={handleDragEnd}
                className="w-full p-2 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                title={plant.name}
              >
                <span className="text-xl block text-center">{plant.icon}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay para móvil */}
      {screenSize === 'mobile' && sidebarState !== 'collapsed' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarState('collapsed')}
        />
      )}

      {/* Área principal del canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar superior */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-800">Mi Jardín</h1>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                Guardar
              </button>
              <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors">
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Canvas área */}
        <div 
          className="flex-1 bg-green-50 relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log('Planta colocada:', data);
            // Aquí integrarías con Konva.js
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TreePine size={48} className="mx-auto mb-2" />
              <p>Arrastra plantas desde la barra lateral para comenzar a diseñar tu jardín</p>
              <p className="text-sm mt-1">
                Tamaño de pantalla: {screenSize} | Estado sidebar: {sidebarState}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveSidebar;