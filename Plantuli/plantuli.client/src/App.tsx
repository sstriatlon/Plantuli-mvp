import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, closestCenter, type DragEndEvent, type DragStartEvent, type Modifier } from '@dnd-kit/core';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { GardenCanvas } from './components/GardenCanvas';
import { PlantCatalog } from './components/PlantCatalog';
import { CacheDebugPanel } from './components/CacheDebugPanel';
import { PlantDragPreview } from './components/PlantDragPreview';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { MobileToolbar } from './components/MobileToolbar';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useSwipe } from './hooks/useSwipe';
import { mockPlants } from './data/mockPlants';
import { runAssetTest } from './utils/assetTester';
import { assetCache } from './utils/assetCache';
import { 
    saveGardenNative, 
    loadGardenNative, 
    downloadGardenFile, 
    loadGardenFileInput, 
    isFileSystemAccessSupported 
} from './utils/nativeFileSystem';
import type { AppState, Viewport, LayerVisibility, Plant, Tool } from './types';

type SidebarState = 'collapsed' | 'normal' | 'expanded';
type ScreenSize = 'mobile' | 'tablet' | 'desktop';

function App() {
    // Detectar screen size inicial basado en window.innerWidth
    const initialScreenSize: ScreenSize = (() => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 768) {
                return 'mobile';
            }
            if (window.innerWidth <= 1200) {
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
        minSwipeDistance: 75
    });
    
    // Configure DnD sensors
    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Start drag after 8px movement to avoid accidental drags
        },
    });
    const keyboardSensor = useSensor(KeyboardSensor);
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 200, // 200ms delay for touch to avoid scroll conflicts
            tolerance: 8,
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
            zoom: 1,
            pan: { x: 0, y: 0 },
            bounds: { minZoom: 0.5, maxZoom: 10 }
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
            
            if (width < 768) {
                setScreenSize('mobile');
                // En móvil, forzar sidebar colapsado inicialmente
                if (sidebarState === 'expanded') {
                    setSidebarState('collapsed');
                }
            } else if (width <= 1200) {
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
        const newZoom = Math.min(currentZoom * 1.2, maxZoom);
        handleViewportChange({
            ...appState.viewport,
            zoom: newZoom
        });
    };

    const handleZoomOut = () => {
        const currentZoom = appState.viewport.zoom;
        const minZoom = appState.viewport.bounds.minZoom;
        const newZoom = Math.max(currentZoom / 1.2, minZoom);
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
                        x: Math.min(selectedPlant.position.x + 0.5, 9.5), // +50cm, max 9.5m
                        y: Math.min(selectedPlant.position.y + 0.5, 7.5)  // +50cm, max 7.5m
                    },
                    placedAt: new Date()
                };
                
                setAppState(prev => ({
                    ...prev,
                    placedPlants: [...prev.placedPlants, newPlant],
                    selectedPlantId: instanceId // Seleccionar la nueva planta
                }));
                
                setNewlyPlacedPlantId(instanceId);
                setTimeout(() => setNewlyPlacedPlantId(null), 400);
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
                
                console.log(`Planta eliminada: ${selectedPlant.plant.name} (${appState.selectedPlantId})`);
            }
        }
    };

    const handleResetViewport = () => {
        handleViewportChange({
            zoom: 1,
            pan: { x: 0, y: 0 },
            bounds: { minZoom: 0.5, maxZoom: 10 }
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
                console.log('✅ Jardín guardado exitosamente:', result.fileName);
            } else {
                if (result.error !== 'Guardado cancelado por el usuario') {
                    showError(
                        'Error al guardar', 
                        result.error || 'No se pudo guardar el jardín'
                    );
                }
                console.error('❌ Error al guardar jardín:', result.error);
            }
        } catch (error: unknown) {
            showError(
                'Error al guardar', 
                `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
            console.error('❌ Error inesperado al guardar:', error);
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
                console.log('✅ Jardín cargado exitosamente:', result.fileName);
            } else {
                if (result.error !== 'Carga cancelada por el usuario') {
                    showError(
                        'Error al cargar', 
                        result.error || 'No se pudo cargar el jardín'
                    );
                }
                console.error('❌ Error al cargar jardín:', result.error);
            }
        } catch (error: unknown) {
            showError(
                'Error al cargar', 
                `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
            console.error('❌ Error inesperado al cargar:', error);
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
        console.log('Planta seleccionada:', plant);
    };

    const handlePlantInstanceSelect = (instanceId: string) => {
        console.log('🔵 handlePlantInstanceSelect called with:', instanceId);
        console.log('🔵 Current state before update:', {
            selectedPlantId: appState.selectedPlantId,
            draggingPlantId: draggingPlantId,
            layerVisibility: appState.layerVisibility
        });
        
        setAppState(prev => {
            const newState = {
                ...prev,
                selectedPlantId: instanceId && instanceId.trim() !== '' ? instanceId : null
            };
            console.log('🔵 New state after update:', {
                selectedPlantId: newState.selectedPlantId,
                layerVisibility: newState.layerVisibility
            });
            return newState;
        });
        
        console.log('🔵 Planta instancia seleccionada:', instanceId);
        console.log('🔵 Estado actual selectedPlantId después de update');
    };

    const handlePlantDragStart = (instanceId: string) => {
        setDraggingPlantId(instanceId);
        console.log('Plant drag started:', instanceId);
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
            console.log('Plant repositioned via Konva drag:', {
                instanceId,
                newPosition
            });
        } else {
            console.log('Plant clicked (position unchanged):', instanceId);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const plantData = active.data.current;
        
        if (plantData?.type === 'plant') {
            setActiveDragItem(plantData.plant);
            console.log('Drag started for plant:', plantData.plant.name);
        } else if (plantData?.type === 'placed-plant') {
            setActiveDragItem(plantData.placedPlant.plant);
            // Select the plant being dragged
            setAppState(prev => ({
                ...prev,
                selectedPlantId: plantData.placedPlant.instanceId
            }));
            console.log('Drag started for placed plant:', plantData.placedPlant.plant.name);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) {
            console.log('Drag cancelled - no drop target');
            setActiveDragItem(null);
            return;
        }

        // Check if dropped on canvas
        if (over.id === 'garden-canvas') {
            const plantData = active.data.current;
            
            if (plantData?.type === 'plant') {
                // Handle new plant from sidebar
                // FIX: Calculate the final mouse position correctly using delta
                const startEvent = event.activatorEvent as MouseEvent;
                const deltaX = event.delta?.x || 0;
                const deltaY = event.delta?.y || 0;
                
                // Final mouse position = start position + drag delta
                const finalMouseX = startEvent.clientX + deltaX;
                const finalMouseY = startEvent.clientY + deltaY;
                
                console.log('🟦 Drop coordinates debug (FIXED):', {
                    startPosition: { x: startEvent.clientX, y: startEvent.clientY },
                    delta: { x: deltaX, y: deltaY },
                    finalMousePosition: { x: finalMouseX, y: finalMouseY },
                    canvasRect: canvasRect ? {
                        left: canvasRect.left,
                        top: canvasRect.top,
                        width: canvasRect.width,
                        height: canvasRect.height
                    } : 'null',
                    viewport: {
                        zoom: appState.viewport.zoom,
                        pan: { x: appState.viewport.pan.x, y: appState.viewport.pan.y }
                    }
                });
                
                let canvasX, canvasY;
                
                if (canvasRect) {
                    // Convert screen coordinates to canvas-relative coordinates
                    const canvasRelativeX = finalMouseX - canvasRect.left;
                    const canvasRelativeY = finalMouseY - canvasRect.top;
                    
                    console.log('🟦 Canvas-relative coords:', {
                        canvasRelativeX,
                        canvasRelativeY,
                        calculation: `${finalMouseX} - ${canvasRect.left} = ${canvasRelativeX}`
                    });
                    
                    // Convert from viewport coordinates to content coordinates
                    // Account for the pan offset and zoom
                    canvasX = (canvasRelativeX - appState.viewport.pan.x) / appState.viewport.zoom;
                    canvasY = (canvasRelativeY - appState.viewport.pan.y) / appState.viewport.zoom;
                    
                    console.log('🟦 After viewport transform:', {
                        canvasX,
                        canvasY,
                        calculation: `(${canvasRelativeX} - ${appState.viewport.pan.x}) / ${appState.viewport.zoom} = ${canvasX}`
                    });
                } else {
                    // Fallback: use a default position if canvas rect not available
                    canvasX = 100; // Default to 1 meter
                    canvasY = 100; // Default to 1 meter
                    console.log('🟦 Using fallback position');
                }
                
                const realX = canvasX / 100;
                const realY = canvasY / 100;
                
                // Validate that the plant is within canvas bounds (10m x 8m)
                const canvasBounds = { width: 10, height: 8 }; // meters
                const clampedRealX = Math.max(0, Math.min(canvasBounds.width - 0.1, realX));
                const clampedRealY = Math.max(0, Math.min(canvasBounds.height - 0.1, realY));
                
                const wasClampedX = Math.abs(clampedRealX - realX) > 0.01;
                const wasClampedY = Math.abs(clampedRealY - realY) > 0.01;
                
                if (wasClampedX || wasClampedY) {
                    console.log('🟦 Plant position was clamped to canvas bounds:', {
                        original: { x: realX, y: realY },
                        clamped: { x: clampedRealX, y: clampedRealY },
                        bounds: canvasBounds
                    });
                }
                
                console.log('🟦 Final result:', {
                    canvasCoords: { x: canvasX, y: canvasY },
                    realCoords: { x: clampedRealX, y: clampedRealY },
                    willAppearAt: `${clampedRealX * 100}px, ${clampedRealY * 100}px in canvas`
                });
                
                const instanceId = crypto.randomUUID();
                const newPlacedPlant = {
                    instanceId,
                    plant: plantData.plant,
                    position: { x: clampedRealX, y: clampedRealY },
                    rotation: 0,
                    scale: 1,
                    placedAt: new Date()
                };
                
                console.log('🟦 Creating new plant:', {
                    instanceId,
                    plantName: plantData.plant.name,
                    position: { x: clampedRealX, y: clampedRealY },
                    willRenderAt: `${clampedRealX * 100}px, ${clampedRealY * 100}px`
                });
                
                setAppState(prev => {
                    const newState = {
                        ...prev,
                        placedPlants: [...prev.placedPlants, newPlacedPlant]
                    };
                    console.log('🟦 Updated placedPlants count:', newState.placedPlants.length);
                    return newState;
                });
                
                setNewlyPlacedPlantId(instanceId);
                setTimeout(() => setNewlyPlacedPlantId(null), 400);
                
                console.log('🟦 Plant creation completed');
                
            } else if (plantData?.type === 'placed-plant') {
                // Handle repositioning existing plant
                // FIX: Use consistent coordinate calculation for placed plants
                const startEvent = event.activatorEvent as MouseEvent;
                const deltaX = event.delta?.x || 0;
                const deltaY = event.delta?.y || 0;
                
                // Final mouse position = start position + drag delta
                const finalMouseX = startEvent.clientX + deltaX;
                const finalMouseY = startEvent.clientY + deltaY;
                
                if (canvasRect) {
                    // Convert screen coordinates to canvas-relative coordinates
                    const canvasRelativeX = finalMouseX - canvasRect.left;
                    const canvasRelativeY = finalMouseY - canvasRect.top;
                    
                    // Convert from viewport coordinates to content coordinates
                    const canvasX = (canvasRelativeX - appState.viewport.pan.x) / appState.viewport.zoom;
                    const canvasY = (canvasRelativeY - appState.viewport.pan.y) / appState.viewport.zoom;
                    
                    const realX = canvasX / 100;
                    const realY = canvasY / 100;
                    
                    // Validate that the plant is within canvas bounds (10m x 8m)
                    const canvasBounds = { width: 10, height: 8 }; // meters
                    const clampedRealX = Math.max(0, Math.min(canvasBounds.width - 0.1, realX));
                    const clampedRealY = Math.max(0, Math.min(canvasBounds.height - 0.1, realY));
                    
                    // Update existing plant position
                    setAppState(prev => ({
                        ...prev,
                        placedPlants: prev.placedPlants.map(plant => 
                            plant.instanceId === plantData.placedPlant.instanceId
                                ? { ...plant, position: { x: clampedRealX, y: clampedRealY } }
                                : plant
                        )
                    }));
                    
                    console.log('Plant repositioned via DnD:', {
                        name: plantData.placedPlant.plant.name,
                        instanceId: plantData.placedPlant.instanceId,
                        finalMousePosition: { x: finalMouseX, y: finalMouseY },
                        newPosition: { x: clampedRealX, y: clampedRealY },
                        wasClamped: Math.abs(clampedRealX - realX) > 0.01 || Math.abs(clampedRealY - realY) > 0.01
                    });
                } else {
                    console.log('Cannot reposition plant - no canvas rect available');
                }
            }
        }
        
        // Reset active drag item
        setActiveDragItem(null);
    };


    // Setup asset cache and testing
    useEffect(() => {
        // Run asset testing in development
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Ejecutando tests de assets...');
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
            return screenSize === 'mobile' ? '0px' : '80px';
        }
        
        switch (screenSize) {
            case 'mobile':
                return sidebarState === 'expanded' ? '90vw' : '280px';
            case 'tablet':
                return sidebarState === 'expanded' ? '350px' : '280px';
            case 'desktop':
                return sidebarState === 'expanded' ? '450px' : '320px';
            default:
                return '320px';
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