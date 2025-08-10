import type { SavedGarden } from './gardenStorage';
import type { PlacedPlant, Viewport } from '../types';

// Verificar soporte del File System Access API
export function isFileSystemAccessSupported(): boolean {
    return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

// Crear archivo de jardín con metadatos
export function createGardenFile(
    name: string,
    placedPlants: PlacedPlant[],
    viewport: Viewport
): SavedGarden {
    return {
        id: `garden_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        placedPlants: [...placedPlants],
        viewport: { ...viewport },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1
    };
}

// Guardar jardín usando File System Access API
export async function saveGardenNative(
    placedPlants: PlacedPlant[],
    viewport: Viewport,
    suggestedName?: string
): Promise<{ success: boolean; error?: string; fileName?: string }> {
    try {
        if (!isFileSystemAccessSupported()) {
            return { success: false, error: 'File System Access API no soportado en este navegador' };
        }

        // Configurar opciones del diálogo
        const options = {
            types: [
                {
                    description: 'Archivos de jardín Plantuli',
                    accept: {
                        'application/json': ['.plantuli', '.json']
                    }
                }
            ],
            suggestedName: suggestedName || `jardin-${new Date().toISOString().split('T')[0]}.plantuli`
        };

        // Mostrar diálogo nativo "Guardar como..."
        const fileHandle = await (window as any).showSaveFilePicker(options);
        
        // Crear archivo de jardín
        const gardenData = createGardenFile(
            fileHandle.name.replace(/\.(plantuli|json)$/, ''), // Remover extensión del nombre
            placedPlants,
            viewport
        );

        // Escribir archivo
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(gardenData, null, 2));
        await writable.close();

        return { 
            success: true, 
            fileName: fileHandle.name 
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Guardado cancelado por el usuario' };
        }
        
        return { 
            success: false, 
            error: `Error al guardar: ${error.message || 'Error desconocido'}` 
        };
    }
}

// Cargar jardín usando File System Access API
export async function loadGardenNative(): Promise<{ 
    success: boolean; 
    data?: SavedGarden; 
    error?: string; 
    fileName?: string 
}> {
    try {
        if (!isFileSystemAccessSupported()) {
            return { success: false, error: 'File System Access API no soportado en este navegador' };
        }

        // Configurar opciones del diálogo
        const options = [
            {
                description: 'Archivos de jardín Plantuli',
                accept: {
                    'application/json': ['.plantuli', '.json']
                }
            }
        ];

        // Mostrar diálogo nativo "Abrir archivo..."
        const [fileHandle] = await (window as any).showOpenFilePicker({
            types: options,
            multiple: false
        });

        // Leer archivo
        const file = await fileHandle.getFile();
        const contents = await file.text();
        
        // Parsear JSON
        let gardenData: SavedGarden;
        try {
            gardenData = JSON.parse(contents);
        } catch (parseError) {
            return { 
                success: false, 
                error: 'El archivo no tiene un formato válido de jardín Plantuli' 
            };
        }

        // Validar estructura básica
        if (!gardenData.placedPlants || !gardenData.viewport || !gardenData.name) {
            return { 
                success: false, 
                error: 'El archivo no contiene datos válidos de jardín' 
            };
        }

        return { 
            success: true, 
            data: gardenData,
            fileName: file.name
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Carga cancelada por el usuario' };
        }
        
        return { 
            success: false, 
            error: `Error al cargar: ${error.message || 'Error desconocido'}` 
        };
    }
}

// Fallback: Descargar archivo (para navegadores sin soporte)
export function downloadGardenFile(
    placedPlants: PlacedPlant[],
    viewport: Viewport,
    fileName?: string
): { success: boolean; error?: string; fileName?: string } {
    try {
        const gardenData = createGardenFile(
            fileName || `jardin-${new Date().toISOString().split('T')[0]}`,
            placedPlants,
            viewport
        );

        const dataStr = JSON.stringify(gardenData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        
        // Crear link temporal y hacer click
        const link = document.createElement('a');
        link.href = url;
        link.download = `${gardenData.name}.plantuli`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        URL.revokeObjectURL(url);

        return { 
            success: true, 
            fileName: `${gardenData.name}.plantuli` 
        };

    } catch (error: any) {
        return { 
            success: false, 
            error: `Error al descargar: ${error.message || 'Error desconocido'}` 
        };
    }
}

// Fallback: Cargar archivo vía input file (para navegadores sin soporte)
export function loadGardenFileInput(): Promise<{ 
    success: boolean; 
    data?: SavedGarden; 
    error?: string; 
    fileName?: string 
}> {
    return new Promise((resolve) => {
        // Crear input file temporal
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.plantuli,.json';
        input.style.display = 'none';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                resolve({ success: false, error: 'No se seleccionó ningún archivo' });
                return;
            }

            try {
                const contents = await file.text();
                const gardenData: SavedGarden = JSON.parse(contents);
                
                // Validar estructura básica
                if (!gardenData.placedPlants || !gardenData.viewport || !gardenData.name) {
                    resolve({ 
                        success: false, 
                        error: 'El archivo no contiene datos válidos de jardín' 
                    });
                    return;
                }

                resolve({ 
                    success: true, 
                    data: gardenData,
                    fileName: file.name
                });

            } catch (error: any) {
                resolve({ 
                    success: false, 
                    error: `Error al leer archivo: ${error.message || 'Error desconocido'}` 
                });
            } finally {
                document.body.removeChild(input);
            }
        };

        input.oncancel = () => {
            resolve({ success: false, error: 'Carga cancelada por el usuario' });
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    });
}