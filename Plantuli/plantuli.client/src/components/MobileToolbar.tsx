import { useState } from 'react';
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
    RotateCcw,
    X,
    ChevronUp
} from 'lucide-react';

interface MobileToolbarProps {
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

export function MobileToolbar({
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
}: MobileToolbarProps) {
    const [showBottomSheet, setShowBottomSheet] = useState(false);

    // Obtener icono de la herramienta activa
    const getActiveToolIcon = () => {
        switch (activeTool) {
            case 'select':
                return <MousePointer2 size={24} />;
            case 'clone-plant':
                return <Copy size={24} />;
            case 'delete':
                return <Trash2 size={24} />;
            default:
                return <MousePointer2 size={24} />;
        }
    };

    // Obtener color de la herramienta activa
    const getActiveToolColor = () => {
        switch (activeTool) {
            case 'select':
                return 'bg-green-500';
            case 'clone-plant':
                return 'bg-blue-500';
            case 'delete':
                return 'bg-red-500';
            default:
                return 'bg-green-500';
        }
    };

    return (
        <>
            {/* FAB (Floating Action Button) */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setShowBottomSheet(true)}
                    className={`
                        ${getActiveToolColor()} text-white
                        w-14 h-14 rounded-full shadow-lg
                        flex items-center justify-center
                        transition-all duration-200
                        hover:scale-105 active:scale-95
                        border-2 border-white
                    `}
                    style={{
                        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                    }}
                >
                    {getActiveToolIcon()}
                </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="fixed bottom-6 left-6 right-20 z-50">
                <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50">
                    <div className="flex items-center justify-center gap-1 px-4 py-2">
                        {/* Zoom controls */}
                        <button 
                            onClick={onZoomOut}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ZoomOut size={20} className="text-gray-600" />
                        </button>
                        <button 
                            onClick={onZoomIn}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ZoomIn size={20} className="text-gray-600" />
                        </button>
                        
                        {/* Separator */}
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        
                        {/* View toggles */}
                        <button 
                            onClick={onToggleGrid}
                            className={`p-2 rounded-full transition-colors ${
                                showGrid 
                                    ? 'bg-purple-500 text-white' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <Grid3X3 size={20} />
                        </button>
                        <button 
                            onClick={onToggleRulers}
                            className={`p-2 rounded-full transition-colors ${
                                showRulers 
                                    ? 'bg-purple-500 text-white' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <Ruler size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Overlay */}
            {showBottomSheet && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={() => setShowBottomSheet(false)}
                />
            )}

            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50
                bg-white rounded-t-3xl shadow-2xl
                transform transition-transform duration-300 ease-out
                ${showBottomSheet ? 'translate-y-0' : 'translate-y-full'}
            `}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <ChevronUp size={20} className="text-gray-500" />
                        <h3 className="font-semibold text-gray-800">Herramientas</h3>
                    </div>
                    <button
                        onClick={() => setShowBottomSheet(false)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                    {/* Main Tools */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Herramientas Principales</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => {
                                    onToolChange('select');
                                    setShowBottomSheet(false);
                                }}
                                className={`
                                    flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                    ${activeTool === 'select' 
                                        ? 'bg-green-500 text-white shadow-md' 
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <MousePointer2 size={24} />
                                <span className="text-xs font-medium">Seleccionar</span>
                            </button>

                            <button 
                                onClick={() => {
                                    if (hasSelectedPlant) {
                                        onToolChange('clone-plant');
                                        setShowBottomSheet(false);
                                    }
                                }}
                                disabled={!hasSelectedPlant}
                                className={`
                                    flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                    ${activeTool === 'clone-plant'
                                        ? 'bg-blue-500 text-white shadow-md' 
                                        : hasSelectedPlant
                                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Copy size={24} />
                                <span className="text-xs font-medium">Clonar</span>
                            </button>

                            <button 
                                onClick={() => {
                                    if (hasSelectedPlant) {
                                        onToolChange('delete');
                                        setShowBottomSheet(false);
                                    }
                                }}
                                disabled={!hasSelectedPlant}
                                className={`
                                    flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                    ${activeTool === 'delete'
                                        ? 'bg-red-500 text-white shadow-md' 
                                        : hasSelectedPlant
                                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Trash2 size={24} />
                                <span className="text-xs font-medium">Eliminar</span>
                            </button>
                        </div>
                    </div>

                    {/* File Actions */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Archivo</h4>
                        <div className="grid grid-cols-4 gap-3">
                            <button 
                                onClick={() => {
                                    onSave();
                                    setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <Save size={20} />
                                <span className="text-xs font-medium">Guardar</span>
                            </button>

                            <button 
                                onClick={() => {
                                    onLoad();
                                    setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <FolderOpen size={20} />
                                <span className="text-xs font-medium">Cargar</span>
                            </button>

                            <button 
                                onClick={() => {
                                    onNew();
                                    setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <FileText size={20} />
                                <span className="text-xs font-medium">Nuevo</span>
                            </button>

                            <button 
                                onClick={() => {
                                    onResetViewport();
                                    setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <RotateCcw size={20} />
                                <span className="text-xs font-medium">Reset</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}