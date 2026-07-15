# MASTER.md — Sistema de Diseño

## Biblioteca Escolar Moderna

### Personalidad visual
Editorial, académica, moderna, clara. Inspirada en el diseño editorial de libros y revistas académicas. La interfaz transmite orden, confianza y calma. Sin decoración gratuita. Cada elemento tiene una función.

### Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-bg` | `#FAFAF9` | Fondo general (papel crudo) |
| `--color-surface` | `#FFFFFF` | Superficies (tarjetas, inputs) |
| `--color-primary` | `#1E3A5F` | Azul petróleo oscuro — encabezados, botones primarios, enlaces |
| `--color-primary-hover` | `#162D4A` | Hover del primary |
| `--color-accent` | `#C75B2C` | Naranja terracota — acentos, badges, detalles |
| `--color-text` | `#1C1917` | Texto principal (casi negro, cálido) |
| `--color-text-muted` | `#6B7280` | Texto secundario |
| `--color-border` | `#E5E7EB` | Bordes suaves |
| `--color-error` | `#DC2626` | Errores |
| `--color-success` | `#16A34A` | Éxito |

### Tipografía

- **Títulos**: `'Merriweather', Georgia, serif` — peso 700 para h1/h2, 400 para subtítulos
- **Cuerpo**: `'Inter', system-ui, sans-serif` — peso 400 regular, 500 medium, 600 semibold
- **Monospace**: `'JetBrains Mono', monospace` solo para código
- Escala: `text-xs` (12) → `text-sm` (14) → `text-base` (16) → `text-lg` (18) → `text-xl` (20) → `text-2xl` (24) → `text-3xl` (30)

### Espaciado

Usar la escala nativa de Tailwind: `space-y-4`, `p-6`, `gap-4`, etc. El espaciado general debe ser amplio pero contenido. Máximo `max-w-md` en formularios, `max-w-6xl` en páginas interiores.

### Botones

- **Primario**: Fondo `bg-primary`, texto blanco, `rounded-md`, `px-6 py-2.5`, hover `bg-primary-hover`, transición 150ms
- **Secundario**: Borde `border border-primary`, texto primary, sin fondo
- **Ghost**: Sin borde, texto muted, hover con fondo suave
- **Link**: Texto primary subrayado solo en hover
- Todos con `cursor-pointer`, `transition-colors duration-150`, `text-sm font-medium`
- Estado loading: spinner SVG + texto deshabilitado

### Inputs

- Borde `border border-border`, fondo `bg-surface`, `rounded-md`, `px-4 py-2.5`
- Placeholder: `text-text-muted`
- Focus: `ring-1 ring-primary border-primary`, `outline-none`
- Label: `text-sm font-medium text-text`, `mb-1.5`
- Error: `border-error`, `ring-error`
- Mensaje de error: `text-xs text-error mt-1`

### Navegación

- Header superior fijo con sombra suave (`shadow-sm`), fondo blanco
- Logo/nombre del sistema a la izquierda
- Enlaces y acciones a la derecha
- Sin sidebar ni menús complejos en Sprint 1

### Estados loading

- Spinner circular SVG animado (giro) centrado
- Botones: spinner + "Cargando…" o similar
- Sin skeletons complejos por ahora

### Estados error

- Alertas con fondo rojo muy claro (`bg-red-50`), borde `border-error`, texto `text-error`
- Toast de error mediante React Hot Toast
- Los errores de API se muestran textualmente debajo del formulario

### Responsive

- Mobile-first: los formularios ocupan todo el ancho disponible
- `sm:` para pantallas ≥640px
- En móvil, el header se vuelve compacto
- Sin menú hamburguesa en Sprint 1
- Transiciones suaves en cambios de layout

### Elementos prohibidos

- ❌ Gradientes morados genéricos
- ❌ Glassmorphism (fondos borrosos/translúcidos)
- ❌ Tarjetas decorativas sin contenido funcional
- ❌ Iconos decorativos sin función (no repetir el mismo icono)
- ❌ Sombras excesivas (más de `shadow-md`)
- ❌ Texto genérico generado por IA (lorem ipsum, "bienvenido a tu plataforma")
- ❌ Estética de dashboard SaaS (métrica hinchada, gráficos decorativos)
- ❌ Emojis como iconos de UI
- ❌ Animaciones que causan desplazamiento de layout
- ❌ Contenido escondido detrás de navbars fijas
