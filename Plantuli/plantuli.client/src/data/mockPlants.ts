import type { Plant } from '../types';
import { getPlantAssets } from '../utils/plantAssets';

export const mockPlants: Plant[] = [
  {
    id: 'rose-red',
    name: 'Rosa Roja',
    type: 'flower',
    category: 'sun',
    size: { width: 0.6, height: 0.8 },
    color: '#dc2626',
    icon: '🌹', // Fallback emoji
    assets: getPlantAssets('rose-red'),
    description: 'Hermosa rosa roja clásica, perfecta para jardines soleados',
    spacing: 0.5
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    type: 'herb',
    category: 'sun',
    size: { width: 0.4, height: 0.5 },
    color: '#8b5cf6',
    icon: '🪻', // Fallback emoji
    assets: getPlantAssets('lavender'),
    description: 'Aromática planta con propiedades relajantes',
    spacing: 0.3
  },
  {
    id: 'sunflower',
    name: 'Girasol',
    type: 'flower',
    category: 'sun',
    size: { width: 0.5, height: 2.0 },
    color: '#fbbf24',
    icon: '🌻', // Fallback emoji
    assets: getPlantAssets('sunflower'),
    description: 'Flor alta y brillante que sigue al sol',
    spacing: 0.8
  },
  {
    id: 'oak-tree',
    name: 'Roble',
    type: 'tree',
    category: 'partial',
    size: { width: 4.0, height: 8.0 },
    color: '#065f46',
    icon: '🌳', // Fallback emoji
    assets: getPlantAssets('oak-tree'),
    description: 'Árbol grande y longevo, ideal para sombra',
    spacing: 6.0
  },
  {
    id: 'basil',
    name: 'Albahaca',
    type: 'herb',
    category: 'partial',
    size: { width: 0.3, height: 0.4 },
    color: '#16a34a',
    icon: '🌿', // Fallback emoji
    assets: getPlantAssets('basil'),
    description: 'Hierba aromática perfecta para cocinar',
    spacing: 0.2
  },
  {
    id: 'tomato',
    name: 'Tomate',
    type: 'vegetable',
    category: 'sun',
    size: { width: 0.6, height: 1.5 },
    color: '#dc2626',
    icon: '🍅', // Fallback emoji
    assets: getPlantAssets('tomato'),
    description: 'Vegetal básico para huerta casera',
    spacing: 0.5
  },
  {
    id: 'fern',
    name: 'Helecho',
    type: 'shrub',
    category: 'shade',
    size: { width: 0.8, height: 0.6 },
    color: '#166534',
    icon: '🌿', // Fallback emoji
    assets: getPlantAssets('fern'),
    description: 'Planta de sombra con hojas delicadas',
    spacing: 0.4
  },
  {
    id: 'pine-tree',
    name: 'Pino',
    type: 'tree',
    category: 'sun',
    size: { width: 2.5, height: 12.0 },
    color: '#134e4a',
    icon: '🌲', // Fallback emoji
    assets: getPlantAssets('pine-tree'),
    description: 'Conífera de crecimiento rápido',
    spacing: 4.0
  },
  {
    id: 'tulip',
    name: 'Tulipán',
    type: 'flower',
    category: 'partial',
    size: { width: 0.2, height: 0.4 },
    color: '#e11d48',
    icon: '🌷', // Fallback emoji
    assets: getPlantAssets('tulip'),
    description: 'Bulbo colorido de primavera',
    spacing: 0.15
  },
  {
    id: 'lettuce',
    name: 'Lechuga',
    type: 'vegetable',
    category: 'partial',
    size: { width: 0.3, height: 0.2 },
    color: '#16a34a',
    icon: '🥬', // Fallback emoji
    assets: getPlantAssets('lettuce'),
    description: 'Verdura de hoja para ensaladas',
    spacing: 0.25
  },
  {
    id: 'azalea',
    name: 'Azalea',
    type: 'shrub',
    category: 'shade',
    size: { width: 1.2, height: 1.0 },
    color: '#ec4899',
    icon: '🌺', // Fallback emoji
    assets: getPlantAssets('azalea'),
    description: 'Arbusto floreciente para zonas sombreadas',
    spacing: 1.0
  },
  {
    id: 'mint',
    name: 'Menta',
    type: 'herb',
    category: 'partial',
    size: { width: 0.4, height: 0.3 },
    color: '#059669',
    icon: '🌱', // Fallback emoji
    assets: getPlantAssets('mint'),
    description: 'Hierba refrescante de crecimiento rápido',
    spacing: 0.3
  },
  {
    id: 'daffodil',
    name: 'Narciso',
    type: 'flower',
    category: 'sun',
    size: { width: 0.2, height: 0.3 },
    color: '#fbbf24',
    icon: '🌼', // Fallback emoji
    assets: getPlantAssets('daffodil'),
    description: 'Bulbo amarillo que anuncia la primavera',
    spacing: 0.12
  },
  {
    id: 'pepper',
    name: 'Pimiento',
    type: 'vegetable',
    category: 'sun',
    size: { width: 0.5, height: 0.8 },
    color: '#dc2626',
    icon: '🌶️', // Fallback emoji
    assets: getPlantAssets('pepper'),
    description: 'Vegetal colorido y sabroso',
    spacing: 0.4
  },
  {
    id: 'boxwood',
    name: 'Boj',
    type: 'shrub',
    category: 'partial',
    size: { width: 0.8, height: 0.8 },
    color: '#166534',
    icon: '🌳', // Fallback emoji
    assets: getPlantAssets('boxwood'),
    description: 'Arbusto compacto ideal para setos',
    spacing: 0.6
  },
  {
    id: 'rosemary',
    name: 'Romero',
    type: 'herb',
    category: 'sun',
    size: { width: 0.6, height: 1.0 },
    color: '#166534',
    icon: '🌿', // Fallback emoji
    assets: getPlantAssets('rosemary'),
    description: 'Hierba aromática resistente a la sequía',
    spacing: 0.5
  },
  {
    id: 'lily',
    name: 'Lirio',
    type: 'flower',
    category: 'partial',
    size: { width: 0.3, height: 0.8 },
    color: '#f8fafc',
    icon: '🏵️', // Fallback emoji
    assets: getPlantAssets('lily'),
    description: 'Flor elegante de bulbo',
    spacing: 0.25
  },
  {
    id: 'carrot',
    name: 'Zanahoria',
    type: 'vegetable',
    category: 'sun',
    size: { width: 0.1, height: 0.3 },
    color: '#f97316',
    icon: '🥕', // Fallback emoji
    assets: getPlantAssets('carrot'),
    description: 'Raíz comestible de crecimiento subterráneo',
    spacing: 0.05
  },
  {
    id: 'hydrangea',
    name: 'Hortensia',
    type: 'shrub',
    category: 'shade',
    size: { width: 1.5, height: 1.2 },
    color: '#3b82f6',
    icon: '💐', // Fallback emoji
    assets: getPlantAssets('hydrangea'),
    description: 'Arbusto con grandes flores globulares',
    spacing: 1.2
  },
  {
    id: 'thyme',
    name: 'Tomillo',
    type: 'herb',
    category: 'sun',
    size: { width: 0.3, height: 0.2 },
    color: '#16a34a',
    icon: '🌿', // Fallback emoji
    assets: getPlantAssets('thyme'),
    description: 'Hierba pequeña y aromática',
    spacing: 0.2
  }
];