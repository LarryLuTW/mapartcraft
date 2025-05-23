# Project Structure and Organization

## Root Directory Layout

```
mapartcraft/
├── mapart-cli.js                 # Main CLI entry point
├── package.json                  # Node.js dependencies and scripts
├── package-lock.json             # Locked dependency versions
├── README.md                     # CLI usage documentation
├── LICENSE                       # Project license
├── TODO.md                       # Development roadmap
├── build.sh                      # Build script
├── .gitignore                    # Git ignore patterns
├── .env                          # Environment variables
│
├── src/                          # Source code
├── public/                       # Static web assets
├── docs/                         # Documentation
├── output/                       # Generated output files
├── buildSources/                 # Build-related sources
├── tools/                        # Development tools
└── context/                      # Codebase documentation (this folder)
```

## Source Code Organization (`src/`)

### Core Structure
```
src/
├── index.js                      # React app entry point
├── index.css                     # Global styles
├── cookieManager.js              # Browser storage utilities
├── kenpixel_mini_square.woff     # Custom font
│
├── components/                   # React components
│   ├── root.js                   # Main app component
│   ├── root.css                  # Root component styles
│   ├── header.js                 # Navigation header
│   ├── header.css                # Header styles
│   ├── faq.js                    # FAQ component
│   ├── faq.css                   # FAQ styles
│   ├── languages.js              # Language selector
│   ├── languages.css             # Language styles
│   ├── tooltip.js                # Tooltip component
│   ├── tooltip.css               # Tooltip styles
│   │
│   └── mapart/                   # Core mapart functionality
│
├── images/                       # Image assets
└── locale/                       # Internationalization files
```

### Mapart Component Structure (`src/components/mapart/`)

```
mapart/
├── mapartController.js           # Main controller component
├── mapartController.css          # Controller styles
│
├── mapSettings.js                # Settings panel component
├── mapSettings.css               # Settings styles
│
├── mapPreview.js                 # Preview rendering component
├── mapPreview.css                # Preview styles
│
├── materials.js                  # Material list component
├── materials.css                 # Material styles
│
├── blockSelection.js             # Block selection interface
├── blockSelection.css            # Block selection styles
│
├── blockImage.js                 # Individual block display
├── blockImage.css                # Block image styles
│
├── greenButtons.js               # Action buttons component
├── greenButtons.css              # Button styles
│
├── nbtReader.js                  # NBT file reader utility
│
├── workers/                      # Core processing logic
├── json/                         # Configuration data
├── viewOnline2D/                 # 2D preview components
├── viewOnline3D/                 # 3D preview components
├── viewOnlineCommon/             # Shared preview utilities
├── autoCompleteInputBlockToAdd/  # Auto-complete input
├── blockSelectionAddCustom/      # Custom block addition
└── bufferedNumberInput/          # Numeric input component
```

### Worker Modules (`src/components/mapart/workers/`)

```
workers/
├── mapCanvas.jsworker            # Image processing engine
└── nbt.jsworker                  # NBT generation engine
```

**Naming Convention**: Files ending with `.jsworker` contain core processing logic that can be shared between the web interface and CLI. Originally designed for Web Workers, hence the naming.

### Configuration Data (`src/components/mapart/json/`)

```
json/
├── coloursJSON.json              # Master block color database (269KB)
├── supportedVersions.json        # Minecraft version mappings
├── mapModes.json                 # Output format definitions
├── ditherMethods.json            # Dithering algorithm configurations
├── whereSupportBlocksModes.json  # Support block placement modes
├── defaultPresets.json           # Default block selections
├── cropModes.json                # Image cropping options
└── backgroundColourModes.json    # Background color handling
```

### Internationalization (`src/locale/`)

```
locale/
├── de/                           # German
├── en/                           # English (default)
├── eo/                           # Esperanto
├── es/                           # Spanish
├── et/                           # Estonian
├── fr/                           # French
├── it/                           # Italian
├── ja/                           # Japanese
├── lt/                           # Lithuanian
├── pl/                           # Polish
├── pt/                           # Portuguese
├── pt-Br/                        # Portuguese (Brazil)
├── ru/                           # Russian
├── ua/                           # Ukrainian
├── zh-Hans/                      # Chinese (Simplified)
└── zh-Hant/                      # Chinese (Traditional)
```

Each locale directory contains translation JSON files matching the component structure.

## Public Assets (`public/`)

```
public/
├── images/                       # Web interface images
│   ├── blocks/                   # Block texture images
│   ├── icons/                    # UI icons
│   └── previews/                 # Preview images
├── manifest.json                 # PWA manifest
├── favicon.ico                   # Site icon
└── index.html                    # HTML template
```

## Development and Build Files

### Build Sources (`buildSources/`)
```
buildSources/
└── apache/                       # Apache server configurations
```

### Tools (`tools/`)
```
tools/                            # Development utilities and scripts
```

### Output (`output/`)
```
output/                           # Generated files (NBT, images, etc.)
```

## Naming Conventions

### File Naming
- **Components**: camelCase (e.g., `mapPreview.js`)
- **Styles**: Same name as component with `.css` extension
- **Workers**: `.jsworker` extension for shared processing logic
- **Configuration**: Descriptive names with `.json` extension

### Variable Naming Patterns
- **Options**: Prefixed with `optionValue_` (e.g., `optionValue_staircasing`)
- **IDs**: Suffixed with `Id` or `ID` (e.g., `colourSetId`, `uniqueId`)
- **Arrays/Collections**: Plural nouns (e.g., `selectedBlocks`, `maps`)
- **Booleans**: Descriptive predicates (e.g., `supportBlockMandatory`, `betterColour`)

### CSS Class Naming
- **BEM-like methodology**: Block-element-modifier pattern
- **Component-scoped**: Classes prefixed with component name
- **Utility classes**: Short, descriptive names

### JSON Structure Patterns
- **Configuration objects**: Contain `uniqueId` for runtime selection
- **Nested structures**: Hierarchical organization matching usage patterns
- **Version references**: Ampersand prefix (e.g., `"&1.12.2"`) for inheritance

## Module Dependencies

### Import Patterns
- **Relative imports**: Used within component hierarchies
- **Absolute imports**: From `src/` root for utilities
- **Node modules**: Standard npm package imports

### Circular Dependency Prevention
- **Unidirectional data flow**: Parent components pass data down
- **Shared utilities**: Extracted to separate modules
- **Worker isolation**: Processing logic kept stateless

## Code Organization Principles

### Separation of Concerns
- **Presentation**: React components handle UI
- **Logic**: Workers handle data processing
- **Configuration**: JSON files define behavior
- **Styling**: CSS modules for component styling

### Modularity
- **Self-contained components**: Each component has its own files
- **Shared utilities**: Common functions extracted
- **Plugin architecture**: Algorithms defined declaratively

### Maintainability
- **Clear file structure**: Logical grouping of related functionality
- **Consistent naming**: Predictable file and variable names
- **Documentation**: README files and inline comments
- **Configuration-driven**: Behavior changes via JSON, not code changes 