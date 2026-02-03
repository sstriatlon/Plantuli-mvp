/**
 * Constantes de la aplicación Plantuli
 * Centraliza todos los valores mágicos para facilitar mantenimiento y cambios
 */

// ============================================================================
// DIMENSIONES DEL CANVAS
// ============================================================================

/** Ancho del canvas en metros (mundo real) */
export const CANVAS_WIDTH_METERS = 10;

/** Alto del canvas en metros (mundo real) */
export const CANVAS_HEIGHT_METERS = 8;

/** Píxeles por metro a zoom 1x (100px = 1m) */
export const PIXELS_PER_METER = 100;

/** Ancho del canvas en píxeles a zoom 1x */
export const CANVAS_WIDTH_PX = CANVAS_WIDTH_METERS * PIXELS_PER_METER;

/** Alto del canvas en píxeles a zoom 1x */
export const CANVAS_HEIGHT_PX = CANVAS_HEIGHT_METERS * PIXELS_PER_METER;

// ============================================================================
// ZOOM Y VIEWPORT
// ============================================================================

/** Zoom mínimo permitido */
export const MIN_ZOOM = 0.5;

/** Zoom máximo permitido */
export const MAX_ZOOM = 10;

/** Zoom inicial por defecto */
export const DEFAULT_ZOOM = 1;

/** Factor de zoom por paso (botones +/-) */
export const ZOOM_STEP = 1.2;

/** Factor de zoom por scroll de rueda */
export const ZOOM_WHEEL_SCALE = 1.08;

/** Tolerancia para detectar cambios de zoom (evita actualizaciones innecesarias) */
export const ZOOM_CHANGE_THRESHOLD = 0.001;

// ============================================================================
// DRAG & DROP
// ============================================================================

/** Distancia mínima en píxeles para activar drag (evita drags accidentales) */
export const DRAG_ACTIVATION_DISTANCE = 8;

/** Umbral de movimiento en píxeles para considerar un drag real vs click */
export const DRAG_MOVEMENT_THRESHOLD = 5;

/** Tiempo máximo en ms para considerar un click rápido (vs drag) */
export const QUICK_CLICK_THRESHOLD_MS = 150;

/** Delay en ms para activar drag en touch (evita conflictos con scroll) */
export const TOUCH_DRAG_DELAY_MS = 200;

/** Tolerancia en píxeles para drag en touch */
export const TOUCH_DRAG_TOLERANCE = 8;

/** Distancia mínima de swipe para activar gesto */
export const SWIPE_MIN_DISTANCE = 75;

// ============================================================================
// GRID Y REGLAS
// ============================================================================

/** Tamaño de grid por defecto en píxeles */
export const DEFAULT_GRID_SIZE = 50;

/** Espaciado objetivo para líneas mayores del grid (en píxeles) */
export const GRID_TARGET_SPACING = 100;

/** Valores posibles para espaciado mayor del grid (en metros) */
export const GRID_MAJOR_SPACING_VALUES = [0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100];

/** Factor de división para líneas menores (1/4 del espaciado mayor) */
export const GRID_MINOR_DIVISOR = 4;

/** Tamaño de las reglas en píxeles */
export const RULER_SIZE = 30;

// ============================================================================
// RESPONSIVE - BREAKPOINTS
// ============================================================================

/** Ancho máximo para considerar móvil (px) */
export const MOBILE_BREAKPOINT = 768;

/** Ancho máximo para considerar tablet (px) */
export const TABLET_BREAKPOINT = 1200;

// ============================================================================
// SIDEBAR
// ============================================================================

/** Ancho del sidebar colapsado en desktop/tablet (px) */
export const SIDEBAR_COLLAPSED_WIDTH = 80;

/** Ancho del sidebar normal en móvil (px) */
export const SIDEBAR_MOBILE_NORMAL_WIDTH = 280;

/** Ancho del sidebar normal en tablet (px) */
export const SIDEBAR_TABLET_NORMAL_WIDTH = 280;

/** Ancho del sidebar normal en desktop (px) */
export const SIDEBAR_DESKTOP_NORMAL_WIDTH = 320;

/** Ancho del sidebar expandido en móvil (vw) */
export const SIDEBAR_MOBILE_EXPANDED_WIDTH = '90vw';

/** Ancho del sidebar expandido en tablet (px) */
export const SIDEBAR_TABLET_EXPANDED_WIDTH = 350;

/** Ancho del sidebar expandido en desktop (px) */
export const SIDEBAR_DESKTOP_EXPANDED_WIDTH = 450;

// ============================================================================
// CLONADO DE PLANTAS
// ============================================================================

/** Offset en metros para clonar planta (desplazamiento desde original) */
export const CLONE_OFFSET_METERS = 0.5;

/** Posición máxima X permitida al clonar (metros) */
export const CLONE_MAX_X = 9.5;

/** Posición máxima Y permitida al clonar (metros) */
export const CLONE_MAX_Y = 7.5;

// ============================================================================
// ANIMACIONES
// ============================================================================

/** Duración de animación de confirmación de planta (segundos) */
export const PLANT_CONFIRMATION_ANIMATION_DURATION = 0.15;

/** Escala de animación de confirmación (1.1x = 10% más grande) */
export const PLANT_CONFIRMATION_SCALE = 1.1;

/** Tiempo de visibilidad del efecto de confirmación (ms) */
export const PLANT_CONFIRMATION_DURATION_MS = 400;

// ============================================================================
// VISUALES - OPACIDADES
// ============================================================================

/** Opacidad del círculo de fondo de planta */
export const PLANT_BACKGROUND_OPACITY = 0.8;

/** Opacidad de la imagen de planta */
export const PLANT_IMAGE_OPACITY = 0.9;

/** Opacidad del fallback de planta */
export const PLANT_FALLBACK_OPACITY = 0.7;

/** Opacidad del borde de planta */
export const PLANT_BORDER_OPACITY = 0.5;

/** Opacidad de las líneas mayores del grid */
export const GRID_MAJOR_LINE_OPACITY = 0.6;

/** Opacidad de las líneas menores del grid */
export const GRID_MINOR_LINE_OPACITY = 0.45;

// ============================================================================
// VISUALES - STROKE WIDTHS
// ============================================================================

/** Grosor del stroke del círculo de fondo de planta */
export const PLANT_BACKGROUND_STROKE_WIDTH = 3;

/** Grosor del stroke del borde de planta */
export const PLANT_BORDER_STROKE_WIDTH = 1.5;

/** Grosor del stroke de las líneas mayores del grid */
export const GRID_MAJOR_STROKE_WIDTH = 1.3;

/** Grosor del stroke de las líneas menores del grid */
export const GRID_MINOR_STROKE_WIDTH = 0.8;

/** Grosor del stroke del borde del canvas */
export const CANVAS_BORDER_STROKE_WIDTH = 1.3;

// ============================================================================
// VISUALES - OTROS
// ============================================================================

/** Padding del highlight de selección (píxeles extra alrededor de la planta) */
export const SELECTION_HIGHLIGHT_PADDING = 8;

/** Patrón de dash para bordes (array de [dash, gap]) */
export const DASH_PATTERN: [number, number] = [8, 4];

// ============================================================================
// COORDENADAS Y POSICIONES
// ============================================================================

/** Tolerancia para comparación de posiciones (metros) */
export const POSITION_COMPARISON_TOLERANCE = 0.01;

/** Tolerancia para clamping de posiciones (metros) */
export const POSITION_CLAMP_TOLERANCE = 0.1;

/** Posición por defecto al colocar planta si no hay canvas rect (metros) */
export const DEFAULT_PLANT_POSITION_METERS = 1;

// ============================================================================
// TOUCH GESTURES
// ============================================================================

/** Número mínimo de toques para pinch zoom */
export const PINCH_ZOOM_MIN_TOUCHES = 2;

/** Root margin para intersection observer de lazy loading (px) */
export const LAZY_LOAD_ROOT_MARGIN = '200px';

/** Threshold para intersection observer */
export const LAZY_LOAD_THRESHOLD = 0.1;

// ============================================================================
// ICONOS Y TAMAÑOS UI
// ============================================================================

/** Tamaño de iconos pequeños (lucide-react) */
export const ICON_SIZE_SMALL = 14;

/** Tamaño de iconos medianos (lucide-react) */
export const ICON_SIZE_MEDIUM = 18;

/** Tamaño de texto de fallback de emoji */
export const EMOJI_FALLBACK_SIZE = '2xl';
