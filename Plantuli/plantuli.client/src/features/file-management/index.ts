// Feature: File Management
// Export all public APIs for this feature

export { 
    saveGarden, 
    loadGarden, 
    listGardens, 
    deleteGarden, 
    clearAllGardens, 
    getStorageStats,
    generateGardenId,
    getCurrentTimestamp,
    type SavedGarden,
    type GardenStorageResult
} from './utils/gardenStorage';

export {
    saveGardenNative,
    loadGardenNative,
    downloadGardenFile,
    loadGardenFileInput,
    isFileSystemAccessSupported,
    createGardenFile
} from './utils/nativeFileSystem';

export { SaveGardenModal } from './components/SaveGardenModal';
