import type { PlacedPlant, Viewport } from '../types';

// Interfaces para el sistema de persistencia
export interface SavedGarden {
    id: string;
    name: string;
    placedPlants: PlacedPlant[];
    viewport: Viewport;
    createdAt: string; // ISO string for JSON serialization
    lastModified: string;
    version: number; // Para futuras migraciones
}

export interface GardenStorageResult {
    success: boolean;
    data?: SavedGarden | SavedGarden[];
    error?: string;
}

// Constantes
const STORAGE_KEY = 'plantuli_gardens';
const STORAGE_VERSION = 1;
const MAX_GARDENS = 50; // Límite para evitar llenar localStorage

// Utilidades
export function generateGardenId(): string {
    return `garden_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

// Validaciones
function isValidGarden(garden: unknown): garden is SavedGarden {
    if (!garden || typeof garden !== 'object') return false;
    
    const g = garden as Record<string, unknown>;
    return (
        typeof g.id === 'string' &&
        typeof g.name === 'string' &&
        Array.isArray(g.placedPlants) &&
        typeof g.viewport === 'object' &&
        typeof g.createdAt === 'string' &&
        typeof g.lastModified === 'string' &&
        typeof g.version === 'number'
    );
}

function validateGardenName(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= 50;
}

// Funciones de localStorage
function getStoredGardens(): SavedGarden[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        
        return parsed.filter(isValidGarden);
    } catch (error) {
        console.error('Error reading gardens from localStorage:', error);
        return [];
    }
}

function saveGardensToStorage(gardens: SavedGarden[]): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gardens));
        return true;
    } catch (error) {
        console.error('Error saving gardens to localStorage:', error);
        return false;
    }
}

// Funciones principales CRUD
export function saveGarden(
    name: string, 
    placedPlants: PlacedPlant[], 
    viewport: Viewport,
    existingId?: string
): GardenStorageResult {
    try {
        // Validar nombre
        if (!validateGardenName(name)) {
            return {
                success: false,
                error: 'El nombre del jardín debe tener entre 1 y 50 caracteres'
            };
        }

        const gardens = getStoredGardens();
        const timestamp = getCurrentTimestamp();
        
        // Determinar si es actualización o creación
        const gardenId = existingId || generateGardenId();
        const existingIndex = gardens.findIndex(g => g.id === gardenId);
        
        const garden: SavedGarden = {
            id: gardenId,
            name: name.trim(),
            placedPlants: [...placedPlants], // Crear copia
            viewport: { ...viewport }, // Crear copia
            createdAt: existingIndex >= 0 ? gardens[existingIndex].createdAt : timestamp,
            lastModified: timestamp,
            version: STORAGE_VERSION
        };

        if (existingIndex >= 0) {
            // Actualizar existente
            gardens[existingIndex] = garden;
        } else {
            // Verificar límite
            if (gardens.length >= MAX_GARDENS) {
                return {
                    success: false,
                    error: `Máximo ${MAX_GARDENS} jardines permitidos`
                };
            }
            
            // Agregar nuevo
            gardens.push(garden);
        }

        // Ordenar por última modificación (más reciente primero)
        gardens.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

        if (saveGardensToStorage(gardens)) {
            return {
                success: true,
                data: garden
            };
        } else {
            return {
                success: false,
                error: 'Error al guardar en localStorage'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`
        };
    }
}

export function loadGarden(id: string): GardenStorageResult {
    try {
        const gardens = getStoredGardens();
        const garden = gardens.find(g => g.id === id);
        
        if (!garden) {
            return {
                success: false,
                error: 'Jardín no encontrado'
            };
        }

        return {
            success: true,
            data: garden
        };
    } catch (error) {
        return {
            success: false,
            error: `Error al cargar jardín: ${error instanceof Error ? error.message : 'Desconocido'}`
        };
    }
}

export function listGardens(): GardenStorageResult {
    try {
        const gardens = getStoredGardens();
        return {
            success: true,
            data: gardens
        };
    } catch (error) {
        return {
            success: false,
            error: `Error al listar jardines: ${error instanceof Error ? error.message : 'Desconocido'}`
        };
    }
}

export function deleteGarden(id: string): GardenStorageResult {
    try {
        const gardens = getStoredGardens();
        const initialLength = gardens.length;
        const filteredGardens = gardens.filter(g => g.id !== id);
        
        if (filteredGardens.length === initialLength) {
            return {
                success: false,
                error: 'Jardín no encontrado'
            };
        }

        if (saveGardensToStorage(filteredGardens)) {
            return {
                success: true
            };
        } else {
            return {
                success: false,
                error: 'Error al eliminar del localStorage'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `Error al eliminar jardín: ${error instanceof Error ? error.message : 'Desconocido'}`
        };
    }
}

// Función de utilidad para limpiar storage
export function clearAllGardens(): GardenStorageResult {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: `Error al limpiar jardines: ${error instanceof Error ? error.message : 'Desconocido'}`
        };
    }
}

// Función para obtener estadísticas
export function getStorageStats() {
    const gardens = getStoredGardens();
    const totalSize = localStorage.getItem(STORAGE_KEY)?.length || 0;
    
    return {
        totalGardens: gardens.length,
        maxGardens: MAX_GARDENS,
        storageSize: `${(totalSize / 1024).toFixed(2)} KB`,
        oldestGarden: gardens.length > 0 ? gardens[gardens.length - 1].createdAt : null,
        newestGarden: gardens.length > 0 ? gardens[0].lastModified : null
    };
}