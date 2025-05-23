# Technology Stack

## Core Languages and Runtime

### JavaScript (Node.js)
- **Version**: Requires Node.js v22.x+
- **Runtime Environment**: Node.js for CLI, Browser for web interface
- **Standard**: ES6+ features used throughout

### React (Web Interface)
- **Version**: React 17.0.2
- **Build Tool**: Create React App (react-scripts 4.0.3)
- **Router**: React Router DOM 5.2.0
- **Testing**: Jest, React Testing Library

## Key Dependencies

### Image Processing
- **Sharp** (v0.34.1)
  - High-performance image processing library
  - Native module with libvips bindings
  - Used for: Image resizing, format conversion, buffer operations
  - Features: Nearest neighbor scaling, RGBA buffer output

### Command Line Interface
- **Yargs** (v17.7.2)
  - Command-line argument parsing and validation
  - Automatic help generation
  - Type checking and default values
  - Used exclusively in `mapart-cli.js`

### Compression and Archives
- **Node.js zlib** (Built-in)
  - Gzip compression for NBT output files
  - Synchronous compression for CLI simplicity

- **JSZip** (v3.6.0) - Web only
  - Client-side ZIP file generation
  - Used for packaging multiple output files

- **Pako** (v1.0.11) - Web only
  - JavaScript implementation of zlib
  - Used for browser-based compression

### 3D Visualization (Web Interface)
- **Three.js** (v0.129.0)
  - WebGL-based 3D rendering
  - Used for 3D preview of generated structures
  - Handles camera controls, lighting, block geometry

### Development and Build Tools
- **React Scripts** (v4.0.3)
  - Webpack configuration abstraction
  - Babel transpilation
  - Development server with hot reload
  - Production build optimization

## Custom Implementations

### NBT (Named Binary Tag) System
- **Custom NBT Writer**: Full NBT format implementation
  - Binary serialization of Minecraft schematic data
  - Support for all NBT tag types (compound, list, array, primitives)
  - Big-endian byte order compliance
  - Memory-efficient buffer management with auto-resizing

### Color Science Algorithms
- **RGB to LAB Conversion**: Custom implementation
  - Perceptually uniform color space conversion
  - Improved color matching accuracy vs. RGB
  - Performance-optimized with caching

- **Dithering Algorithms**: Multiple implementations
  - Floyd-Steinberg error diffusion
  - Bayer matrix patterns (2x2, 4x4)
  - Ordered dithering (3x3)
  - Burkes, Sierra Lite, Stucki, Atkinson variants
  - Min-average error diffusion

### Minecraft Block Database
- **269KB JSON Database**: Comprehensive block catalog
  - ~8,500 lines of block definitions
  - Multi-version compatibility (1.12.2 - 1.20+)
  - Color tone variants (normal, dark, light, unobtainable)
  - Block properties and NBT metadata
  - Version reference system for backwards compatibility

## Architecture Patterns

### Worker Pattern (Pseudo-Workers)
- Files named `*.jsworker` contain processing logic
- Originally designed for Web Workers
- Refactored for shared use between web and CLI
- Stateless functions with explicit parameter passing

### Configuration-Driven Design
- JSON configuration files for all algorithmic behavior
- Runtime algorithm selection via unique IDs
- Extensible system for adding new methods

### Functional Pipeline Architecture
- Immutable data transformations where possible
- Clear separation of concerns between processing stages
- Error handling at each transformation step

## File Formats and Standards

### Input Formats
- **Images**: Any format supported by Sharp
  - PNG, JPEG, WebP, TIFF, GIF, SVG
  - Automatic format detection
  - RGBA color space normalization

### Output Formats
- **NBT (Named Binary Tag)**
  - Minecraft's standard binary format
  - Gzipped for compression
  - Compatible with WorldEdit, MCEdit, and similar tools

- **Map.dat Files** (Web interface only)
  - Direct Minecraft map data format
  - Region file compatible
  - Suitable for server deployment

### Configuration Formats
- **JSON**: All configuration files
  - Human-readable and editable
  - Structured with clear hierarchies
  - Version-specific data organization

## Build and Deployment

### CLI Distribution
- Single executable script (`mapart-cli.js`)
- Shebang for Unix-like systems (`#!/usr/bin/env node`)
- Self-contained with all dependencies
- No compilation step required

### Web Application Build
- **Production Build**: `npm run build`
  - Static file generation
  - Asset optimization and minification
  - Code splitting for performance
  - Service worker for offline capability

### Development Workflow
- **Development Server**: `npm start`
  - Hot module replacement
  - Live reload on file changes
  - Source map generation for debugging

## Performance Considerations

### Memory Management
- Streaming image processing where possible
- Buffer reuse in NBT writer
- LRU caching for color calculations
- Garbage collection-friendly patterns

### Computational Optimization
- Color space conversion caching
- Nearest neighbor lookups with spatial indexing
- Efficient dithering matrix operations
- Minimal object allocation in hot paths

### Scalability
- CLI designed for batch processing
- Web interface with progress reporting
- Configurable quality vs. speed trade-offs
- Memory-efficient for large structure generation

## Browser Compatibility (Web Interface)

### Minimum Requirements
- **Modern Browsers**: Chrome 88+, Firefox 78+, Safari 14+
- **WebGL Support**: Required for 3D preview
- **File API**: For drag-and-drop functionality
- **Web Workers**: For non-blocking processing

### Polyfills and Fallbacks
- Automatic polyfill injection via React App
- Graceful degradation for older browsers
- Progressive enhancement approach 