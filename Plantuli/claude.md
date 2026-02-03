# Context - Garden Planner Project

## Important
- ALL instructions within this document MUST BE FOLLOWED, these are not optional unless explicitly stated.
- DO NOT edit more code than you have to.
- DO NOT WASTE TOKENS, be succinct and concise.

## Project Summary
Interactive garden planning web app with drag & drop canvas interface.
**Stack:** .NET 8 + React + TypeScript + PostgreSQL + Azure App Service

## Key Documentation
En el siguiente folder se encuentra documentacion complementaria que siempre se debe seguir:
docs
Hasta ahora solo esta "backlog.md"

## Key Technologies
- Front end: React 19 + Konva.js + @dnd-kit + Tailwind CSS
- Backend: ASP.NET Core 8 + Clean Architecture
- Database: PostgreSQL con PostGIS (datos espaciales)
- Hosting: Azure App Service (PaaS)
- Storage: Azure Blob Storage + CDN
- Auth: Azure AD B2C
- Monitoring: Application Insights + Azure Monitor

### Infraestructura
Azure App Service: Basic B1
  - vCPU: 1 core
  - RAM: 1.75 GB
  - Storage: 10 GB

PostgreSQL: Basic B1
  - vCore: 1
  - RAM: 2 GB  
  - Storage: 50 GB

Servicios adicionales:
  - Azure AD B2C: $0/mes (free tier)
  - Blob Storage: $5/mes
  - Domain: $1/mes

## Important Conventions

### Code Style
- Variables, constantes, funciones, interfaces, etc. deben tener sus nombres en inglés
- El castellano es solo a fines de documentación y UI
- Usar TypeScript estricto
- Preferir funciones nombradas sobre arrow functions anónimas cuando sea posible

### File Organization - Feature-First Architecture

La aplicación sigue una **arquitectura feature-first con composition root**:

```
src/
├── app/                    # Configuración de la aplicación
│   └── providers/          # React providers globales
├── features/               # Features organizadas por dominio
│   ├── notifications/      # Sistema de notificaciones (Toast)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── file-management/   # Guardar/cargar jardines
│   │   ├── components/
│   │   ├── utils/
│   │   └── index.ts
│   ├── layout/             # Header, Toolbar, MobileToolbar
│   │   ├── components/
│   │   └── index.ts
│   ├── drag-and-drop/      # Drag & drop functionality
│   │   ├── components/
│   │   └── index.ts
│   ├── garden-canvas/      # Canvas principal y componentes relacionados
│   │   ├── components/     # GardenCanvas, Rulers, PlacedPlantCanvas, SelectionHighlight
│   │   ├── utils/          # coordinateSystem
│   │   └── index.ts
│   └── plant-management/   # Catálogo y gestión de plantas
│       ├── components/     # PlantCatalog, PlantCard, PlantImage
│       └── index.ts
├── shared/                 # Código compartido entre features
│   ├── components/         # Modal, CacheDebugPanel
│   ├── constants/          # Todas las constantes centralizadas
│   ├── types/              # Tipos TypeScript compartidos
│   ├── utils/              # logger, assetCache, coordinateHelpers
│   └── index.ts
├── hooks/                  # Hooks globales (useSwipe, useAssetCacheMetrics, useMigrationMode)
├── data/                   # Datos mock (mockPlants)
├── utils/                   # Utilidades específicas (assetTester, plantAssets, plantMigration)
└── App.tsx                 # Composition root - orquesta todas las features
```

**Principios:**
- Cada feature tiene su propio `index.ts` que exporta su API pública
- Features no deben importar directamente de otras features
- Código compartido va en `shared/`
- `App.tsx` actúa como composition root, orquestando todas las features

### Imports Pattern
```typescript
// ✅ Correcto - Importar desde el index de la feature
import { GardenCanvas } from './features/garden-canvas';
import { PlantCatalog } from './features/plant-management';
import { logger, assetCache } from './shared';

// ❌ Incorrecto - Importar directamente desde componentes internos
import { GardenCanvas } from './features/garden-canvas/components/GardenCanvas';
```

### State Management Patterns
- Estado local con `useState` y `useCallback`
- Estado global en `App.tsx` (composition root)
- Hooks personalizados para lógica reutilizable
- No usar librerías de estado global (Redux, Zustand, etc.) por ahora

### Components Patterns
- Componentes funcionales con TypeScript
- Props tipadas con interfaces
- Separación de concerns: presentación vs lógica
- Hooks personalizados para lógica compleja

#### Frontend

##### Arquitectura en capas multi-canvas
La **separación en capas específicas** optimiza dramáticamente el performance:

```typescript
const layers = {
  background: createLayer('background', 1),  // Césped, caminos (estático)
  plants: createLayer('plants', 2),         // Plantas principales
  selection: createLayer('selection', 3),   // Estados de selección
  ui: createLayer('ui', 4)                  // Reglas, herramientas
};
```

##### Sistema de coordenadas dual
Implementación de **coordinate system** que maneja tanto píxeles canvas como medidas reales:

```typescript
class GardenCoordinateSystem {
  constructor(realWorldScale: number = 1) {
    this.scale = realWorldScale; // 1px = 1cm
  }
  
  canvasToReal(canvasPoint: Position): Position {
    return {
      x: (canvasPoint.x - this.origin.x) * this.scale,
      y: (canvasPoint.y - this.origin.y) * this.scale
    };
  }
}
```

##### Detección de proximidad híbrida
Combinación **Spatial Hash + Quadtree** optimizada según tamaño de objetos:
- **Spatial Hash**: Plantas pequeñas y elementos uniformes (performance superior)
- **Quadtree**: Árboles grandes y elementos variables
- **Array lineal**: Objetos muy grandes que cubren múltiples celdas

##### Microinteracciones avanzadas
Basado en análisis de **Figma, Canva y Adobe XD**:
- **Drag preview**: Transparencia 60% durante arrastre con información contextual
- **Snap guidelines**: Líneas automáticas de alineación y distancias ideales entre plantas
- **Progressive disclosure**: Información adicional aparece gradualmente al hover
- **Success animations**: Micro-bounce confirma colocación exitosa

## Key Files to Know

### Core Application
- `src/App.tsx` - Composition root, orquesta todas las features
- `src/main.tsx` - Entry point de la aplicación

### Features
- `src/features/garden-canvas/` - Canvas principal y renderizado
- `src/features/plant-management/` - Catálogo y gestión de plantas
- `src/features/file-management/` - Persistencia de jardines
- `src/features/layout/` - Componentes de layout (Header, Toolbars)
- `src/features/notifications/` - Sistema de notificaciones
- `src/features/drag-and-drop/` - Funcionalidad de drag & drop

### Shared
- `src/shared/constants/index.ts` - Todas las constantes centralizadas
- `src/shared/types/index.ts` - Tipos TypeScript compartidos
- `src/shared/utils/logger.ts` - Sistema de logging condicional
- `src/shared/utils/assetCache.ts` - Cache inteligente de assets
- `src/shared/utils/coordinateHelpers.ts` - Helpers de conversión de coordenadas

### Data & Utils
- `src/data/mockPlants.ts` - Datos mock de plantas
- `src/utils/assetTester.ts` - Testing de assets
- `src/utils/plantAssets.ts` - Generación de rutas de assets
- `src/utils/plantMigration.ts` - Migración de datos legacy

### Hooks
- `src/hooks/useSwipe.ts` - Gestos de swipe
- `src/hooks/useAssetCacheMetrics.ts` - Métricas del cache
- `src/hooks/useMigrationMode.ts` - Modo de migración

## Development Tips
- Si bien a nivel de código se manejan las palabras en inglés, la página debe estar en castellano, dado que está apuntada al mercado Argentino
- Usar `logger.debug()` para logs de desarrollo (solo se muestran en dev)
- Usar `logger.warn()` y `logger.error()` para advertencias y errores (siempre visibles)
- Las constantes están centralizadas en `shared/constants/index.ts` - NO usar valores mágicos

## Performance Considerations
- Cache inteligente de assets con prioridades dinámicas
- Lazy loading de imágenes con Intersection Observer
- Renderizado optimizado con capas separadas en Konva
- Preload de assets críticos basado en proximidad visual

## Security
- Validar todas las entradas del usuario
- Sanitizar datos antes de guardar en localStorage
- Usar HTTPS en producción
- Implementar CSRF protection cuando se conecte al backend

## Roadmap de Implementación
El plan es ir implementando la aplicación en fases bien definidas, probar su implementación, estudiar el mercado y de acuerdo a la retroalimentación, avanzar en la siguiente etapa.

### Fase 1: MVP Core (2-3 meses) ✅ COMPLETADO
- ✅ Canvas básico con React + Konva.js
- ✅ Drag & drop simple desde sidebar
- ✅ Zoom/pan funcional
- ✅ Serialización básica JSON
- ✅ Arquitectura feature-first implementada

### Fase 2: Próximos pasos
- Integración con backend
- Autenticación de usuarios
- Persistencia en base de datos
- Sistema de usuarios y jardines compartidos
