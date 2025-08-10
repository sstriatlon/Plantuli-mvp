import { 
    MousePointer2, 
    Copy, 
    Trash2, 
    ZoomIn, 
    ZoomOut, 
    Grid3X3, 
    Ruler, 
    Save, 
    FolderOpen, 
    FileText, 
    RotateCcw 
} from 'lucide-react';

interface ToolbarProps {
    className?: string;
    screenSize?: 'mobile' | 'tablet' | 'desktop';
    // Estado actual
    activeTool: 'select' | 'clone-plant' | 'delete';
    showGrid: boolean;
    showRulers: boolean;
    hasSelectedPlant: boolean;
    // Handlers
    onToolChange: (tool: 'select' | 'clone-plant' | 'delete') => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onToggleGrid: () => void;
    onToggleRulers: () => void;
    onSave: () => void;
    onLoad: () => void;
    onNew: () => void;
    onResetViewport: () => void;
}

export function Toolbar({ 
    className = '', 
    screenSize = 'desktop',
    activeTool,
    showGrid,
    showRulers,
    hasSelectedPlant,
    onToolChange,
    onZoomIn,
    onZoomOut,
    onToggleGrid,
    onToggleRulers,
    onSave,
    onLoad,
    onNew,
    onResetViewport
}: ToolbarProps) {
    // En móvil, ocultar el toolbar lateral
    if (screenSize === 'mobile') {
        return null;
    }

    return (
        <div className={`
            bg-white border-r border-gray-200 shadow-sm
            py-4 px-3 min-h-full
            ${screenSize === 'tablet' ? 'px-2 py-3' : 'px-3 py-4'}
            ${className}
        `}>
            <div className="flex flex-col items-center">
                {/* Todas las herramientas en columna */}
                <div className="flex flex-col items-center gap-3">
                    {/* Grupo: Herramientas de interacción */}
                    <div className="flex flex-col bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                            onClick={() => onToolChange('select')}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                activeTool === 'select' 
                                    ? 'bg-green-500 text-white shadow-md' 
                                    : 'hover:bg-white hover:shadow-sm text-gray-700 hover:text-green-600'
                            }`}
                            title="Seleccionar"
                        >
                            <MousePointer2 size={18} />
                        </button>
                        <button 
                            onClick={() => onToolChange('clone-plant')}
                            disabled={!hasSelectedPlant}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                activeTool === 'clone-plant' 
                                    ? 'bg-green-500 text-white shadow-md' 
                                    : hasSelectedPlant
                                        ? 'hover:bg-white hover:shadow-sm text-gray-700 hover:text-green-600'
                                        : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={hasSelectedPlant ? "Clonar Planta" : "Selecciona una planta para clonar"}
                        >
                            <Copy size={18} />
                        </button>
                        <button 
                            onClick={() => onToolChange('delete')}
                            disabled={!hasSelectedPlant}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                activeTool === 'delete' 
                                    ? 'bg-red-500 text-white shadow-md' 
                                    : hasSelectedPlant
                                        ? 'hover:bg-white hover:shadow-sm text-gray-700 hover:text-red-600'
                                        : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={hasSelectedPlant ? "Eliminar planta seleccionada" : "Selecciona una planta para eliminar"}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="h-px w-6 bg-gray-300"></div>

                    {/* Grupo: Controles de zoom */}
                    <div className="flex flex-col bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                            onClick={onZoomIn}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-blue-600"
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button 
                            onClick={onZoomOut}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-blue-600"
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="h-px w-6 bg-gray-300"></div>

                    {/* Grupo: Toggles de visualización */}
                    <div className="flex flex-col bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                            onClick={onToggleGrid}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                showGrid 
                                    ? 'bg-purple-500 text-white shadow-md' 
                                    : 'hover:bg-white hover:shadow-sm text-gray-700 hover:text-purple-600'
                            }`}
                            title={showGrid ? "Ocultar Grilla" : "Mostrar Grilla"}
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button 
                            onClick={onToggleRulers}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                showRulers 
                                    ? 'bg-purple-500 text-white shadow-md' 
                                    : 'hover:bg-white hover:shadow-sm text-gray-700 hover:text-purple-600'
                            }`}
                            title={showRulers ? "Ocultar Reglas" : "Mostrar Reglas"}
                        >
                            <Ruler size={18} />
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="h-px w-6 bg-gray-300"></div>

                    {/* Grupo: Acciones de archivo */}
                    <div className="flex flex-col bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                            onClick={onSave}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-green-600"
                            title="Guardar"
                        >
                            <Save size={18} />
                        </button>
                        <button 
                            onClick={onLoad}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-blue-600"
                            title="Cargar"
                        >
                            <FolderOpen size={18} />
                        </button>
                        <button 
                            onClick={onNew}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-orange-600"
                            title="Nuevo"
                        >
                            <FileText size={18} />
                        </button>
                        <button 
                            onClick={onResetViewport}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-indigo-600"
                            title="Reset Viewport"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}