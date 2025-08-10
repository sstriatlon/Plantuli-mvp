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

## Key Tecnologies
- Front end: React 19 + Konva.js + @dnd-kit
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

## Important conventions
### Code Style
### File organization
### Test
### Common commands
### State management patterns
- Vatio state management library
### Components patterns

#### Frontend

##### Arquitectura en capas multi-canvas
La **separaci�n en capas espec�ficas** optimiza dramatically el performance:

```javascript
const layers = {
  background: createLayer('background', 1),  // C�sped, caminos (est�tico)
  plants: createLayer('plants', 2),         // Plantas principales
  selection: createLayer('selection', 3),   // Estados de selecci�n
  ui: createLayer('ui', 4)                  // Reglas, herramientas
};
```
##### Sistema de coordenadas dual
Implementaci�n de **coordinate system** que maneja tanto p�xeles canvas como medidas reales:

```javascript
class GardenCoordinateSystem {
  constructor(canvasSize, realWorldScale) {
    this.scale = realWorldScale; // 1px = 1cm
  }
  
  canvasToReal(canvasPoint) {
    return {
      x: (canvasPoint.x - this.origin.x) * this.scale,
      y: (canvasPoint.y - this.origin.y) * this.scale
    };
  }
}
```
##### Detecci�n de proximidad h�brida
Combinaci�n **Spatial Hash + Quadtree** optimizada seg�n tama�o de objetos:
- **Spatial Hash**: Plantas peque�as y elementos uniformes (performance superior)
- **Quadtree**: �rboles grandes y elementos variables
- **Array lineal**: Objetos muy grandes que cubren m�ltiples celdas
##### Microinteracciones avanzadas
Basado en an�lisis de **Figma, Canva y Adobe XD**:
- **Drag preview**: Transparencia 60% durante arrastre con informaci�n contextual
- **Snap guidelines**: L�neas autom�ticas de alineaci�n y distancias ideales entre plantas
- **Progressive disclosure**: Informaci�n adicional aparece gradualmente al hover
- **Success animations**: Micro-bounce confirma colocaci�n exitosa

## Key files to know
## Development tips
## Performance considerations
## Security


## Roadmap de implementaci�n
-El plan es ir implementando la aplicacion en fases bien definidas, probar su implementacion, estudiar el mercado y de acuerdo a la retroalimentacion, avanzar en la siguiente etapa.
### Fase 1: MVP Core (2-3 meses)
- Canvas b�sico con React + Konva.js
- Drag & drop simple desde sidebar
- Zoom/pan funcional
- Serializaci�n b�sica JSON