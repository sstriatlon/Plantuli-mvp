import { useState, useEffect } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { listGardens } from '../utils/gardenStorage';
import type { SavedGarden } from '../utils/gardenStorage';

interface SaveGardenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, shouldOverwrite?: boolean) => void;
    defaultName?: string;
}

export function SaveGardenModal({ isOpen, onClose, onSave, defaultName = '' }: SaveGardenModalProps) {
    const [gardenName, setGardenName] = useState(defaultName);
    const [existingGardens, setExistingGardens] = useState<SavedGarden[]>([]);
    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setGardenName(defaultName);
            setShowOverwriteWarning(false);
            loadExistingGardens();
        }
    }, [isOpen, defaultName]);

    // Check for duplicate names
    useEffect(() => {
        const trimmedName = gardenName.trim().toLowerCase();
        const exists = existingGardens.some(garden => 
            garden.name.toLowerCase() === trimmedName
        );
        setShowOverwriteWarning(exists && gardenName.trim().length > 0);
    }, [gardenName, existingGardens]);

    const loadExistingGardens = () => {
        const result = listGardens();
        if (result.success && result.data) {
            setExistingGardens(result.data as SavedGarden[]);
        }
    };

    const handleSave = async () => {
        const trimmedName = gardenName.trim();
        
        if (trimmedName.length === 0) {
            return; // Form validation will show error
        }

        setIsLoading(true);
        
        try {
            onSave(trimmedName, showOverwriteWarning);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading && gardenName.trim().length > 0) {
            handleSave();
        }
    };

    const isNameValid = gardenName.trim().length > 0 && gardenName.trim().length <= 50;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Guardar Jardín"
            size="md"
        >
            <div className="space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600">
                    Dale un nombre a tu jardín para poder guardarlo y cargarlo más tarde.
                </p>

                {/* Garden Name Input */}
                <div className="space-y-2">
                    <label htmlFor="garden-name" className="block text-sm font-medium text-gray-700">
                        Nombre del jardín
                    </label>
                    <input
                        id="garden-name"
                        type="text"
                        value={gardenName}
                        onChange={(e) => setGardenName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ej: Mi jardín de primavera"
                        maxLength={50}
                        className={`
                            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors
                            ${!isNameValid && gardenName.length > 0 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }
                        `}
                        autoFocus
                        disabled={isLoading}
                    />
                    
                    {/* Character count */}
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>
                            {gardenName.trim().length === 0 && gardenName.length > 0 ? 'El nombre no puede estar vacío' : ''}
                            {gardenName.length > 50 ? 'Máximo 50 caracteres' : ''}
                        </span>
                        <span>{gardenName.length}/50</span>
                    </div>
                </div>

                {/* Overwrite Warning */}
                {showOverwriteWarning && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-800">Ya existe un jardín con este nombre</p>
                            <p className="text-amber-600 mt-1">
                                Al guardar, se sobrescribirá el jardín existente.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    
                    <button
                        onClick={handleSave}
                        disabled={!isNameValid || isLoading}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${showOverwriteWarning 
                                ? 'bg-amber-600 hover:bg-amber-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }
                        `}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {showOverwriteWarning ? 'Sobrescribir' : 'Guardar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}