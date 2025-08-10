# 🌿 Backlog Unificado - Fase 1 Garden Planner (Frontend MVP Integrado)

## coding style y tips
 - En cada tarea, cuando sea posible y se crea necesario, implementar test unitarios que me aseguren que la logica implementada a futuro va a ser monitoreada. antes de terminar cada tarea la totalidad de los test existentes debe correr OK y estos tests no deben ser modificados a menos que exista una causa profunda que implique un cambio de la logica en ese componente, mas alla de esto debe ser manejado con cuidado.

---

## 🚀 Setup y Estructura Inicial

### 🔧 T001 - Inicializar proyecto base integrado
- [ ] Usar plantilla Visual Studio (ASP.NET Core + React)
- [ ] Configurar estructura de carpetas: `/components`, `/hooks`, `/utils`, `/types`, `/services`
- [ ] Instalar dependencias principales:
  - `react-konva`, `konva`, `@dnd-kit/core`, `@dnd-kit/sortable`
  - `lucide-react`, `clsx`, `tailwindcss`, `@tailwindcss/forms`
- [ ] Asegurar scripts de desarrollo y build funcionales (`npm run dev`, `build`, `preview`)

### 🧾 T002 - Configuración TypeScript y tipos base
- [ ] Configurar TypeScript estricto
- [ ] Definir interfaces:
  `Plant`, `PlacedPlant`, `Position`, `Viewport`, `AppState`
- [ ] Verificar Intellisense y validaciones funcionando correctamente

---

## 🖼️ Canvas Interactivo y Navegación

### 🎨 T003 - Implementar canvas básico (Konva.js)
- [ ] Componente `<GardenCanvas />` con `Stage` y `Layer`
- [ ] Canvas responsive (70% del ancho de pantalla)
- [ ] Fondo inicial sólido o con grid toggleable

### 🧱 T004 - Sistema de capas y reglas
- [ ] Crear capas: background, plants, UI, overlay
- [ ] Añadir reglas visuales en ejes X/Y (metros)
- [ ] Orden z-index y visibilidad individual de capas

### 🔍 T005 - Navegación canvas: Zoom + Pan
- [ ] Zoom con rueda del mouse (mín 0.5x / máx 10x), se debe hacer zoom al contenido del canvas, no a todo el componente
- [ ] Pan con click + drag (sin herramientas activas), Si el zoom es mayor a 1x, mover el contenido del canvas, si esta alejado hasta el limite de 0.5x mover la layer dentro del componente canvas, siempre
- [ ] Combinación integrada de pan + zoom fluido, el viewport debe permitir moverse en cualquier dirección, incluso dejando espacio vacío visible alrededor del contenido (como en Figma), No debe haber restricciones automáticas de límites, aunque podrías incluir un comportamiento de "ajuste" o "rebote".
    Cuando el usuario hace zoom out, el canvas debería mostrar más espacio alrededor del contenido. Al hacer click + drag (pan): 
    El contenido parece "flotar" dentro del canvas.
    No hay bordes fijos que detengan el movimiento (como en Miro o Figma).
    Podés colocar elementos "fuera del área visible" y luego moverte para verlos.


---

## 🌱 Sidebar y Plantas Base

### 📚 T006 - Sidebar de plantas
- [ ] Catalogo de plantas en el sidebar, en forma de listado responsivo, adecuado al sidebar de forma moderna y armonica. Por ahora sin elementos reales, pueden ir un par de cards a modo de ejemplo
- [ ] Cards con: imagen pequena a la izquierda, nombre, tipo
- [ ] Búsqueda por nombre + filtros por sol/sombra y tamaño

### 🧪 T007 - Mock de datos y representación visual
- [ ] Mockear 15-20 plantas (array local)
- [ ] Componente `<Plant />` visual: ícono, radio, tipo, color
- [ ] Hover effect + visual diferenciada por categoría

---

## 🎯 Drag & Drop e Interacción

### 🧲 T008 - Implementar drag & drop
- [ ] Configurar `@dnd-kit/core`
- [ ] Drag desde `<Sidebar />` al `<Canvas />` de plantas.
- [ ] Preview semitransparente en movimiento del icono de la planta
- [ ] Drop en canvas crea nueva planta, con un pequenio efecto de confirmacion cuando se posiciona correctamente


### 🛠️ T009 - Interacción con plantas en canvas
- [ ] Reposicionar plantas existentes
- [ ] Seleccionar planta (highlight), trazo delicado conteniendo a la planta en forma de cuadrado o rectangulo con bordes redondeados
- [ ] Eliminar planta seleccionada (tecla `Delete`)
- [ ] Estado de selección en `AppState`

---

## 🧰 Toolbar Superior

### 🔨 T010 - Controles principales
- [ ] Componente `<Toolbar />` superior con:
  - Herramientas: seleccionar, agregar, borrar
  - Zoom In / Zoom Out
  - Toggle Grid y Rulers
  - Botones: Guardar, Cargar, Nuevo, Reset Viewport

---

## 💾 Persistencia Local

### 💽 T011 - Guardado y carga en localStorage
- [ ] Simular backend con `mockGardenApi.ts`
- [ ] Funciones `saveGarden()` y `getGardens()`
- [ ] Botones Guardar/Cargar exportando JSON
- [ ] Auto-guardado periódico y recuperación al recargar

---

## 📱 Responsive Design y Accesibilidad

### 📐 T012 - Responsive UI
- [ ] Funcionalidad total en desktop, tablet y móvil, ui responsive de acuerdo a la pantalla.
- [ ] Sidebar colapsable (tablet), drawer (mobile)
- [ ] Header compacto y adaptable

### ♿ T013 - Accesibilidad y navegación
- [ ] Navegación por teclado completa
- [ ] `aria-labels` en controles importantes
- [ ] Contraste y tipografía WCAG AA
- [ ] Compatible con screen readers

---
## Features opcionales
- [ ] `snapToGrid` opcional (50cm) de la planta al arrastrarse al canvas
- [ ] Investigar mejora decargado de imagenes mediante sprite sheets

## 🧪 Tests y Calidad

### 🧪 T014 - Tests unitarios e integración
- [ ] Test de componentes clave: `Canvas`, `Sidebar`, `Toolbar`, `Plant`
- [ ] Test de flujo drag & drop completo
- [ ] Verificar que zoom/pan no interfiera con interacciones

### 🚀 T015 - Performance básica
- [ ] Test con 50+ plantas en canvas
- [ ] Medir FPS y tiempo de respuesta
- [ ] Bundle size y profiling inicial

---

## 📊 Documentación y Finalización

### 📋 T016 - Documentación de setup
- [ ] README con pasos para levantar el entorno
- [ ] Explicación de decisiones técnicas
- [ ] Listado de comandos disponibles
- [ ] Diagrama de estructura del proyecto (opcional)

---

## Performance tunning

### T017 - Optimización avanzada de assets

  - Compresión automática de SVGs
    - Implementar pipeline de optimización con SVGO
    - Reducir tamaño de archivos (remover metadatos, simplificar paths, reducir decimales)
    - Configurar build process para optimización automática en producción
    - Target: Reducir tamaño promedio de SVGs en 40-60%
  - Sistema de Sprite Sheets opcional
    - Crear generador automático de sprite sheets para plantas
    - Implementar componente <SpriteImage /> para uso eficiente
    - Configurar lazy loading inteligente (individual vs sprite según contexto)
    - Comparativa de performance: sprites vs assets individuales
  - Optimización de colores y paletas
    - Estandarizar paleta de colores entre todas las plantas
    - Implementar sistema de CSS custom properties para theming
    - Reducir redundancia de colores similares en SVGs

### T018 - Herramientas de gestión de assets

  - Asset Management CLI
    - npm run assets:validate - Validación completa de assets
    - npm run assets:optimize - Compresión masiva de SVGs
    - npm run assets:generate - Auto-generación de variants faltantes
    - npm run assets:audit - Reporte de assets faltantes/problemáticos
  - Asset Inspector Dashboard
    - Panel de desarrollo para visualizar todos los assets
    - Comparación visual entre variants (icon/sprite/thumbnail)
    - Herramientas de debugging para assets problemáticos
    - Métricas de performance y tamaño de assets
  - Bulk Operations System
    - Generador automático de variants desde SVG base
    - Actualización masiva de colores/estilos
    - Conversión batch entre formatos
    - Validador de consistencia visual entre plants
  - Asset Validation Framework
    - Validación automática de estructura SVG
    - Verificación de consistency en tamaños y colores
    - Tests automatizados de carga de assets
    - Integración con CI/CD para prevenir assets rotos

### T019 - UI customizada de carga de jardines

### T020 - features desktop
 1. Advanced Toolbar Features

  - Keyboard shortcuts overlay (Ctrl+Z, Ctrl+S, etc.)
  - Tool grouping mejorado con separadores visuales
  - Quick actions panel expandible
  - Status indicators (zoom level, grid size, etc.)

  2. Enhanced Sidebar Experience

  - Multi-panel layout (plantas + propiedades + capas)
  - Resizable sidebar con drag handles
  - Advanced plant filtering (búsqueda, categorías, favoritos)
  - Plant properties panel cuando seleccionas una planta
  - History/Undo panel para ver cambios recientes

  3. Canvas Advanced Features

  - Mini-map en esquina para navegación
  - Rulers enhancement con click-to-set guides
  - Selection tools mejorados (multi-select, group selection)
  - Context menus right-click con opciones avanzadas
  - Snap guides visuales entre elementos

  4. Workspace Optimization

  - Layout persistence (recordar tamaños de paneles)
  - Multiple workspace tabs (diferentes jardines)
  - Advanced export options (PDF, PNG, diferentes escalas)
  - Collaboration indicators (preparación para futuro)

  5. Productivity Features

  - Command palette (Ctrl+K - como VS Code)
  - Advanced hotkeys para todas las acciones
  - Batch operations (seleccionar múltiples plantas)
  - Templates system (layouts predefinidos)