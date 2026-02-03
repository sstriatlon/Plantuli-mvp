import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, closestCenter, type DragEndEvent, type DragStartEvent, type Modifier } from '@dnd-kit/core';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { GardenCanvas } from './features/garden-canvas';
import { PlantCatalog } from './features/plant-management';
import { CacheDebugPanel } from './components/CacheDebugPanel';
import { PlantDragPreview } from './features/drag-and-drop';
import { Header, Toolbar, MobileToolbar } from './features/layout';
import { ToastContainer, useToast } from './features/notifications';
import { useSwipe } from './hooks/useSwipe';
import { mockPlants } from './data/mockPlants';
import { runAssetTest } from './utils/assetTester';
import { assetCache, logger } from './shared';
import { 
    saveGardenNative, 
    loadGardenNative, 
    downloadGardenFile, 
    loadGardenFileInput, 
    isFileSystemAccessSupported 
} from './features/file-management';
import {
    MOBILE_BREAKPOINT,
    TABLET_BREAKPOINT,
    SWIPE_MIN_DISTANCE,
    DRAG_ACTIVATION_DISTANCE,
    TOUCH_DRAG_DELAY_MS,
    TOUCH_DRAG_TOLERANCE,
    MIN_ZOOM,
    MAX_ZOOM,
    DEFAULT_ZOOM,
    ZOOM_STEP,
    CLONE_OFFSET_METERS,
    CLONE_MAX_X,
    CLONE_MAX_Y,
    PLANT_CONFIRMATION_DURATION_MS,
    SIDEBAR_COLLAPSED_WIDTH,
    SIDEBAR_MOBILE_EXPANDED_WIDTH,
    SIDEBAR_MOBILE_NORMAL_WIDTH,
    SIDEBAR_TABLET_EXPANDED_WIDTH,
    SIDEBAR_TABLET_NORMAL_WIDTH,
    SIDEBAR_DESKTOP_EXPANDED_WIDTH,
    SIDEBAR_DESKTOP_NORMAL_WIDTH
} from './shared/constants';
import { convertScreenToRealWorld } from './shared/utils/coordinateHelpers';
import type { AppState, Viewport, LayerVisibility, Plant, Tool } from './shared/types';

type SidebarState = 'collapsed' | 'normal' | 'expanded';
type ScreenSize = 'mobile' | 'tablet' | 'desktop';

function App() {
    // Detectar screen size inicial basado en window.innerWidth
    const initialScreenSize: ScreenSize = (() => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth < MOBILE_BREAKPOINT) {
                return 'mobile';
            }
            if (window.innerWidth <= TABLET_BREAKPOINT) {
                return 'tablet';
            }
        }
        return 'desktop';
    })();
    
    const [screenSize, setScreenSize] = useState<ScreenSize>(initialScreenSize);
    // Sidebar collapsed por defecto en móvil
    const [sidebarState, setSidebarState] = useState<SidebarState>(
        initialScreenSize === 'mobile' ? 'collapsed' : 'normal'
    );
    const [, setSelectedPlant] = useState<Plant | null>(null);
    const [showLayers, setShowLayers] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState<Plant | null>(null);
    const [newlyPlacedPlantId, setNewlyPlacedPlantId] = useState<string | null>(null);
    const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
    const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
    
    // Toast notifications
    const { toasts, showSuccess, showError, closeToast } = useToast();
    
    // Swipe gestures para cerrar sidebar en tablet
    const swipeHandlers = useSwipe({
        onSwipeRight: () => {
            if (screenSize === 'tablet' && sidebarState === 'normal') {
                setSidebarState('collapsed');
            }
        },
        minSwipeDistance: SWIPE_MIN_DISTANCE
    });
    
    // Configure DnD sensors
    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: DRAG_ACTIVATION_DISTANCE,
        },
    });
    const keyboardSensor = useSensor(KeyboardSensor);
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: TOUCH_DRAG_DELAY_MS,
            tolerance: TOUCH_DRAG_TOLERANCE,
        },
    });
    
    const sensors = useSensors(pointerSensor, keyboardSensor, touchSensor);
    // Center the drag overlay under the cursor regardless of initial grab offset
    const snapCenterToCursor: Modifier = ({ transform, overlayNodeRect, activeNodeRect, activatorEvent }) => {
        const overlayW = overlayNodeRect?.width ?? 0;
        const overlayH = overlayNodeRect?.height ?? 0;

        // Compute initial pointer offset within the active node at activation time
    let offsetX = 0;
    let offsetY = 0;

        if (activatorEvent && activeNodeRect) {
            const isPointer = typeof PointerEvent !== 'undefined' && activatorEvent instanceof PointerEvent;
            const isMouse = typeof MouseEvent !== 'undefined' && activatorEvent instanceof MouseEvent;
            const isTouch = typeof TouchEvent !== 'undefined' && activatorEvent instanceof TouchEvent;

            if (isPointer || isMouse) {
                const evt = activatorEvent as PointerEvent | MouseEvent;
                offsetX = evt.clientX - activeNodeRect.left;
                offsetY = evt.clientY - activeNodeRect.top;
            } else if (isTouch) {
                const tEvt = activatorEvent as TouchEvent;
                const touch = tEvt.touches?.[0] ?? tEvt.changedTouches?.[0];
                if (touch) {
                    offsetX = touch.clientX - activeNodeRect.left;
                    offsetY = touch.clientY - activeNodeRect.top;
                }
            }
        }

        // Fallback: if we couldn't read the event offset, assume grab happened at the center of the active node
        if ((offsetX === 0 && offsetY === 0) && activeNodeRect) {
            offsetX = activeNodeRect.width / 2;
            offsetY = activeNodeRect.height / 2;
        }

        // Position overlay so its center sits under the pointer.
        // Default: transform = pointer - initialOffset.
        // Desired top-left: pointer - overlay/2.
        // Therefore: transform + initialOffset - overlay/2.
        return {
            ...transform,
            x: transform.x + offsetX - overlayW / 2,
            y: transform.y + offsetY - overlayH / 2,
        };
    };

    
    const [appState, setAppState] = useState<AppState>({
        placedPlants: [],
        selectedPlantId: null,
        activeTool: 'select',
        viewport: {
            zoom: DEFAULT_ZOOM,
            pan: { x: 0, y: 0 },
            bounds: { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM }
        },
        showGrid: true,
        showRulers: true,
        snapToGrid: false,
        gridSize: 50,
        layerVisibility: {
            background: true,
            plants: true,
            selection: true,
            ui: true
        }
    });

    // Detectar tamaño de pantalla inicial y cambios
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            
            if (width < MOBILE_BREAKPOINT) {
                setScreenSize('mobile');
                // En móvil, forzar sidebar colapsado inicialmente
                if (sidebarState === 'expanded') {
                    setSidebarState('collapsed');
                }
            } else if (width <= TABLET_BREAKPOINT) {
                setScreenSize('tablet');
            } else {
                setScreenSize('desktop');
            }
        };

        // Ejecutar inmediatamente al montar
        checkScreenSize();
        
        // Agregar listener para cambios de tamaño
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [sidebarState]);

    // Ejecutar test de assets en desarrollo
    useEffect(() => {
        runAssetTest(mockPlants);
    }, []);

    const handleViewportChange = (viewport: Viewport) => {
        setAppState(prev => ({ ...prev, viewport }));
    };

    const toggleGrid = () => {
        setAppState(prev => ({ ...prev, showGrid: !prev.showGrid }));
    };

    const toggleRulers = () => {
        setAppState(prev => ({ ...prev, showRulers: !prev.showRulers }));
    };

    // Toolbar handlers
    const handleToolChange = (tool: Tool) => {
        if (tool === 'clone-plant') {
            handleClonePlant();
            // Volver a select después de clonar
            setAppState(prev => ({ ...prev, activeTool: 'select' }));
        } else if (tool === 'delete') {
            handleDeleteSelectedPlant();
            // Volver a select después de eliminar
            setAppState(prev => ({ ...prev, activeTool: 'select' }));
        } else {
            setAppState(prev => ({ ...prev, activeTool: tool }));
        }
    };

    const handleZoomIn = () => {
        const currentZoom = appState.viewport.zoom;
        const maxZoom = appState.viewport.bounds.maxZoom;
        const newZoom = Math.min(currentZoom * ZOOM_STEP, maxZoom);
        handleViewportChange({
            ...appState.viewport,
            zoom: newZoom
        });
    };

    const handleZoomOut = () => {
        const currentZoom = appState.viewport.zoom;
        const minZoom = appState.viewport.bounds.minZoom;
        const newZoom = Math.max(currentZoom / ZOOM_STEP, minZoom);
        handleViewportChange({
            ...appState.viewport,
            zoom: newZoom
        });
    };

    const handleClonePlant = () => {
        if (appState.selectedPlantId) {
            const selectedPlant = appState.placedPlants.find(p => p.instanceId === appState.selectedPlantId);
            if (selectedPlant) {
                const instanceId = crypto.randomUUID();
                const newPlant = {
                    ...selectedPlant,
                    instanceId,
                    position: { 
                        x: Math.min(selectedPlant.position.x + CLONE_OFFSET_METERS, CLONE_MAX_X),
                        y: Math.min(selectedPlant.position.y + CLONE_OFFSET_METERS, CLONE_MAX_Y)
                    },
                    placedAt: new Date()
                };
                
                setAppState(prev => ({
                    ...prev,
                    placedPlants: [...prev.placedPlants, newPlant],
                    selectedPlantId: instanceId // Seleccionar la nueva planta
                }));
                
                setNewlyPlacedPlantId(instanceId);
                setTimeout(() => setNewlyPlacedPlantId(null), PLANT_CONFIRMATION_DURATION_MS);
            }
        }
    };

    const handleDeleteSelectedPlant = () => {
        if (appState.selectedPlantId) {
            const selectedPlant = appState.placedPlants.find(p => p.instanceId === appState.selectedPlantId);
            if (selectedPlant) {
                setAppState(prev => ({
                    ...prev,
                    placedPlants: prev.placedPlants.filter(p => p.instanceId !== appState.selectedPlantId),
                    selectedPlantId: null
                }));
            }
        }
    };

    const handleResetViewport = () => {
        handleViewportChange({
            zoom: DEFAULT_ZOOM,
            pan: { x: 0, y: 0 },
            bounds: { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM }
        });
    };

    const handleSave = async () => {
        const timestamp = new Date().toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/[/:,\s]/g, '-');
        const suggestedName = `jardin-${timestamp}.plantuli`;

        try {
            let result;
            
            if (isFileSystemAccessSupported()) {
                // Usar diálogo nativo del sistema operativo
                result = await saveGardenNative(appState.placedPlants, appState.viewport, suggestedName);
            } else {
                // Fallback: descargar archivo
                result = downloadGardenFile(appState.placedPlants, appState.viewport, `jardin-${timestamp}`);
            }

            if (result.success) {
                showSuccess(
                    'Jardín guardado', 
                    `"${result.fileName}" se guardó correctamente`
                );
                logger.log('Jardín guardado exitosamente:', result.fileName);
            } else {
                if (result.error !== 'Guardado cancelado por el usuario') {
                    showError(
                        'Error al guardar', 
                        result.error || 'No se pudo guardar el jardín'
                    );
                }
                logger.error('Error al guardar jardín:', result.error);
            }
        } catch (error: unknown) {
            showError(
                'Error al guardar', 
                `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
            logger.error('Error inesperado al guardar:', error);
        }
    };

    const handleLoad = async () => {
        try {
            let result;
            
            if (isFileSystemAccessSupported()) {
                // Usar diálogo nativo del sistema operativo
                result = await loadGardenNative();
            } else {
                // Fallback: input file
                result = await loadGardenFileInput();
            }

            if (result.success && result.data) {
                const garden = result.data;
                
                setAppState(prev => ({
                    ...prev,
                    placedPlants: garden.placedPlants,
                    selectedPlantId: null
                }));
                
                handleViewportChange(garden.viewport);
                
                showSuccess(
                    'Jardín cargado', 
                    `"${result.fileName}" se cargó correctamente`
                );
                logger.log('Jardín cargado exitosamente:', result.fileName);
            } else {
                if (result.error !== 'Carga cancelada por el usuario') {
                    showError(
                        'Error al cargar', 
                        result.error || 'No se pudo cargar el jardín'
                    );
                }
                logger.error('Error al cargar jardín:', result.error);
            }
        } catch (error: unknown) {
            showError(
                'Error al cargar', 
                `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
            logger.error('Error inesperado al cargar:', error);
        }
    };

    const handleNew = () => {
        // Solo mostrar confirmación si hay plantas en el canvas
        if (appState.placedPlants.length > 0) {
            const confirmed = window.confirm(
                '¿Estás seguro de que quieres crear un nuevo jardín?\n\n' +
                'Se perderán todas las plantas del diseño actual.'
            );
            
            if (!confirmed) {
                return; // Cancelar acción
            }
        }
        
        setAppState(prev => ({
            ...prev,
            placedPlants: [],
            selectedPlantId: null
        }));
        handleResetViewport();
    };

    const toggleLayer = (layer: keyof LayerVisibility) => {
        setAppState(prev => ({
            ...prev,
            layerVisibility: {
                ...prev.layerVisibility,
                [layer]: !prev.layerVisibility[layer]
            }
        }));
    };

    const handlePlantSelect = (plant: Plant) => {
        setSelectedPlant(plant);
    };

    const handlePlantInstanceSelect = (instanceId: string) => {
        setAppState(prev => ({
            ...prev,
            selectedPlantId: instanceId && instanceId.trim() !== '' ? instanceId : null
        }));
    };

    const handlePlantDragStart = (instanceId: string) => {
        setDraggingPlantId(instanceId);
    };

    const handlePlantDragEnd = (instanceId: string, newPosition: { x: number; y: number }) => {
        // Always clear dragging state first
        setDraggingPlantId(null);
        
        // Check if position actually changed before updating state
        const currentPlant = appState.placedPlants.find(p => p.instanceId === instanceId);
        const positionChanged = currentPlant && (
            Math.abs(currentPlant.position.x - newPosition.x) > 0.01 ||
            Math.abs(currentPlant.position.y - newPosition.y) > 0.01
        );
        
        if (positionChanged) {
            setAppState(prev => ({
                ...prev,
                placedPlants: prev.placedPlants.map(plant => 
                    plant.instanceId === instanceId
                        ? { ...plant, position: newPosition }
                        : plant
                )
            }));
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const plantData = active.data.current;
        
        if (plantData?.type === 'plant') {
            setActiveDragItem(plantData.plant);
        } else if (plantData?.type === 'placed-plant') {
            setActiveDragItem(plantData.placedPlant.plant);
            // Select the plant being dragged
            setAppState(prev => ({
                ...prev,
                selectedPlantId: plantData.placedPlant.instanceId
            }));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) {
            setActiveDragItem(null);
            return;
        }

        // Check if dropped on canvas
        if (over.id === 'garden-canvas') {
            const plantData = active.data.current;
            
            if (plantData?.type === 'plant') {
                // Handle new plant from sidebar
                // Calculate the final mouse position correctly using delta
                const startEvent = event.activatorEvent as MouseEvent;
                const deltaX = event.delta?.x || 0;
                const deltaY = event.delta?.y || 0;
                
                // Final mouse position = start position + drag delta
                const finalMouseX = startEvent.clientX + deltaX;
                const finalMouseY = startEvent.clientY + deltaY;
                
                // Convert screen coordinates to real-world coordinates
                const position = convertScreenToRealWorld({
                    screenX: finalMouseX,
                    screenY: finalMouseY,
                    canvasRect,
                    viewport: appState.viewport
                });
                
                const instanceId = crypto.randomUUID();
                const newPlacedPlant = {
                    instanceId,
                    plant: plantData.plant,
                    position,
                    rotation: 0,
                    scale: 1,
                    placedAt: new Date()
                };
                
                setAppState(prev => ({
                    ...prev,
                    placedPlants: [...prev.placedPlants, newPlacedPlant]
                }));
                
                setNewlyPlacedPlantId(instanceId);
                setTimeout(() => setNewlyPlacedPlantId(null), PLANT_CONFIRMATION_DURATION_MS);
                
            } else if (plantData?.type === 'placed-plant') {
                // Handle repositioning existing plant
                const startEvent = event.activatorEvent as MouseEvent;
                const deltaX = event.delta?.x || 0;
                const deltaY = event.delta?.y || 0;
                
                // Final mouse position = start position + drag delta
                const finalMouseX = startEvent.clientX + deltaX;
                const finalMouseY = startEvent.clientY + deltaY;
                
                // Convert screen coordinates to real-world coordinates
                const position = convertScreenToRealWorld({
                    screenX: finalMouseX,
                    screenY: finalMouseY,
                    canvasRect,
                    viewport: appState.viewport
                });
                
                // Update existing plant position
                setAppState(prev => ({
                    ...prev,
                    placedPlants: prev.placedPlants.map(plant => 
                        plant.instanceId === plantData.placedPlant.instanceId
                            ? { ...plant, position }
                            : plant
                    )
                }));
            }
        }
        
        // Reset active drag item
        setActiveDragItem(null);
    };


    // Setup asset cache and testing
    useEffect(() => {
        // Run asset testing in development
        if (process.env.NODE_ENV === 'development') {
            logger.log('Ejecutando tests de assets...');
            runAssetTest();
        }

        // Cleanup cache on unmount
        return () => {
            assetCache.destroy();
        };
    }, []);

    // Configuración responsiva de anchos
    const getSidebarWidth = () => {
        if (sidebarState === 'collapsed') {
            return screenSize === 'mobile' ? '0px' : `${SIDEBAR_COLLAPSED_WIDTH}px`;
        }
        
        switch (screenSize) {
            case 'mobile':
                return sidebarState === 'expanded' ? SIDEBAR_MOBILE_EXPANDED_WIDTH : `${SIDEBAR_MOBILE_NORMAL_WIDTH}px`;
            case 'tablet':
                return sidebarState === 'expanded' ? `${SIDEBAR_TABLET_EXPANDED_WIDTH}px` : `${SIDEBAR_TABLET_NORMAL_WIDTH}px`;
            case 'desktop':
                return sidebarState === 'expanded' ? `${SIDEBAR_DESKTOP_EXPANDED_WIDTH}px` : `${SIDEBAR_DESKTOP_NORMAL_WIDTH}px`;
            default:
                return `${SIDEBAR_DESKTOP_NORMAL_WIDTH}px`;
        }
    };

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {/* Apply global cursor style during drag */}
            {activeDragItem && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        * {
                            cursor: grabbing !important;
                        }
                    `
                }} />
            )}
            <div className="min-h-screen bg-gray-100 flex flex-col">
                {/* Header */}
                <Header 
                    screenSize={screenSize}
                    onMenuClick={() => setSidebarState(sidebarState === 'collapsed' ? 'normal' : 'collapsed')}
                />
                
                {/* Main Content: Toolbar + Sidebar + Canvas */}
                <div className="flex flex-1">
                    {/* Toolbar Lateral */}
                    <Toolbar 
                        screenSize={screenSize}
                        activeTool={appState.activeTool}
                        showGrid={appState.showGrid}
                        showRulers={appState.showRulers}
                        hasSelectedPlant={!!appState.selectedPlantId}
                        onToolChange={handleToolChange}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onToggleGrid={toggleGrid}
                        onToggleRulers={toggleRulers}
                        onSave={handleSave}
                        onLoad={handleLoad}
                        onNew={handleNew}
                        onResetViewport={handleResetViewport}
                    />
                    
                    {/* Sidebar Responsivo - Solo renderizar si no está colapsado en móvil */}
                    {!(screenSize === 'mobile' && sidebarState === 'collapsed') && (
                        <div 
                            className={`
                                bg-gradient-to-b from-white via-slate-50 to-gray-50 
                                shadow-2xl shadow-gray-900/10 transition-all duration-300 ease-in-out relative
                                border-r border-gray-200/60 backdrop-blur-sm
                                ${(screenSize === 'mobile' || screenSize === 'tablet') && sidebarState !== 'collapsed' ? 'absolute z-50' : ''}
                                ${screenSize === 'tablet' ? 'h-full' : ''}
                            `}
                            style={{ 
                                width: getSidebarWidth(),
                                ...(screenSize === 'tablet' && sidebarState !== 'collapsed' ? {
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    transform: sidebarState === 'normal' ? 'translateX(0%)' : 'translateX(100%)',
                                    transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)'
                                } : {})
                            }}
                            {...(screenSize === 'tablet' ? swipeHandlers : {})}
                        >

                {/* Contenido expandido */}
                {sidebarState !== 'collapsed' && (
                    <div className="p-6 space-y-6 overflow-y-auto h-full">
                        <div className="space-y-3">
                            {/* Catálogo de Plantas */}
                            <div>
                                <PlantCatalog
                                    onPlantSelect={handlePlantSelect}
                                    sidebarExpanded={sidebarState === 'expanded'}
                                />
                            </div>
                            
                            {/* Control de Capas - Desplegable */}
                            <div className="space-y-3 pt-3">
                                <button
                                    onClick={() => setShowLayers(!showLayers)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200
                                        ${showLayers 
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                            : 'bg-white/60 text-slate-600 border border-gray-200/50 hover:bg-white hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <Eye size={14} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Control de Capas</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                            Experimental
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`transform transition-transform ${showLayers ? 'rotate-180' : ''}`} />
                                </button>

                                {showLayers && (
                                    <div className="space-y-2 p-3 bg-white/40 rounded-lg border border-gray-200/50">
                                        <div className={`
                                            grid gap-2
                                            ${sidebarState === 'expanded' && screenSize === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'}
                                        `}>
                                            <button 
                                                onClick={() => toggleLayer('background')}
                                                className={`
                                                    px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                                                    flex items-center gap-2 group
                                                    ${appState.layerVisibility.background 
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                                                    }
                                                `}
                                            >
                                                {appState.layerVisibility.background ? <Eye size={12} /> : <EyeOff size={12} />}
                                                Fondo
                                            </button>
                                            
                                            <button 
                                                onClick={() => toggleLayer('plants')}
                                                className={`
                                                    px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                                                    flex items-center gap-2 group
                                                    ${appState.layerVisibility.plants 
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                                                    }
                                                `}
                                            >
                                                {appState.layerVisibility.plants ? <Eye size={12} /> : <EyeOff size={12} />}
                                                Plantas
                                            </button>
                                            
                                            <button 
                                                onClick={() => toggleLayer('selection')}
                                                className={`
                                                    px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                                                    flex items-center gap-2 group
                                                    ${appState.layerVisibility.selection 
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                                                    }
                                                `}
                                            >
                                                {appState.layerVisibility.selection ? <Eye size={12} /> : <EyeOff size={12} />}
                                                Selección
                                            </button>
                                            
                                            <button 
                                                onClick={() => toggleLayer('ui')}
                                                className={`
                                                    px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                                                    flex items-center gap-2 group
                                                    ${appState.layerVisibility.ui 
                                                        ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md' 
                                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-gray-200/50'
                                                    }
                                                `}
                                            >
                                                {appState.layerVisibility.ui ? <Eye size={12} /> : <EyeOff size={12} />}
                                                Interfaz
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {sidebarState === 'expanded' && (
                                <div className="mt-6 p-4 bg-white/40 rounded-xl border border-gray-200/50">
                                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                                        Estado del Sistema
                                    </h4>
                                    <div className="space-y-2 text-xs text-slate-500">
                                        <div className="flex justify-between">
                                            <span>Pantalla:</span>
                                            <span className="font-medium text-slate-700 capitalize">{screenSize}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Panel:</span>
                                            <span className="font-medium text-slate-700 capitalize">{sidebarState}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Zoom:</span>
                                            <span className="font-medium text-slate-700">{appState.viewport.zoom.toFixed(1)}x</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pan:</span>
                                            <span className="font-medium text-slate-700 text-xs">
                                                ({Math.round(appState.viewport.pan.x)}, {Math.round(appState.viewport.pan.y)})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {sidebarState === 'normal' && (
                                <div className="mt-4 p-3 bg-white/40 rounded-lg border border-gray-200/50">
                                    <div className="space-y-1 text-xs text-slate-500">
                                        <div className="flex justify-between">
                                            <span>Zoom:</span>
                                            <span className="font-medium text-slate-700">{appState.viewport.zoom.toFixed(1)}x</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="capitalize">{screenSize}</span>
                                            <span className="font-medium text-slate-700 capitalize">{sidebarState}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Vista colapsada - solo info */}
                {sidebarState === 'collapsed' && (
                    <div className="p-3 space-y-3">
                        <div className="text-center text-xs text-slate-400 font-medium capitalize">
                            {screenSize}
                        </div>
                    </div>
                )}
                        </div>
                    )}

                {/* Overlay para móvil y tablet */}
                {(screenSize === 'mobile' || screenSize === 'tablet') && sidebarState !== 'collapsed' && (
                    <div 
                        className={`
                            fixed inset-0 z-40 transition-all duration-300
                            ${screenSize === 'tablet' 
                                ? 'bg-black/30 backdrop-blur-sm' 
                                : 'bg-black/50'
                            }
                        `}
                        onClick={() => setSidebarState('collapsed')}
                    />
                )}

                {/* Canvas - se adapta al espacio restante */}
                <div className={`
                    flex-1 transition-all duration-300 ease-in-out
                    ${(screenSize === 'mobile' || screenSize === 'tablet') && sidebarState !== 'collapsed' ? 'pointer-events-none' : ''}
                `}>
                <GardenCanvas
                    viewport={appState.viewport}
                    showGrid={appState.showGrid}
                    showRulers={appState.showRulers}
                    layerVisibility={appState.layerVisibility}
                    placedPlants={appState.placedPlants}
                    newlyPlacedPlantId={newlyPlacedPlantId}
                    selectedPlantId={appState.selectedPlantId}
                    draggingPlantId={draggingPlantId}
                    onViewportChange={handleViewportChange}
                    onPlantSelect={handlePlantInstanceSelect}
                    onPlantDragStart={handlePlantDragStart}
                    onPlantDragEnd={handlePlantDragEnd}
                    onCanvasPositionChange={setCanvasRect}
                />
                </div>
                
                {/* Cache Debug Panel - Solo en desarrollo */}
                <CacheDebugPanel />
                </div>
            </div>

            {/* Drag Overlay - renders outside normal DOM flow */}
            <DragOverlay 
                dropAnimation={null}
                modifiers={[snapCenterToCursor]}
            >
                {activeDragItem ? (
                    <PlantDragPreview plant={activeDragItem} />
                ) : null}
            </DragOverlay>


            {/* Mobile Toolbar - solo en móvil */}
            {screenSize === 'mobile' && (
                <MobileToolbar
                    activeTool={appState.activeTool}
                    showGrid={appState.showGrid}
                    showRulers={appState.showRulers}
                    hasSelectedPlant={!!appState.selectedPlantId}
                    onToolChange={handleToolChange}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onToggleGrid={toggleGrid}
                    onToggleRulers={toggleRulers}
                    onSave={handleSave}
                    onLoad={handleLoad}
                    onNew={handleNew}
                    onResetViewport={handleResetViewport}
                />
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={closeToast} />
        </DndContext>
    );
}

export default App;