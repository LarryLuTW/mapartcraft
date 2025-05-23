# Architecture Overview

## System Architecture

MapartCraft follows a modular architecture that separates concerns between the web interface, CLI tool, and core processing logic.

```
┌─────────────────────────────────────────────────────────────┐
│                    MapartCraft System                       │
├─────────────────────────────────────────────────────────────┤
│  Web Interface (React)           CLI Tool (Node.js)         │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ • User Interface    │        │ • Argument Parsing  │    │
│  │ • File Upload       │        │ • Image Loading     │    │
│  │ • Real-time Preview │        │ • File I/O          │    │
│  │ • Settings Panel    │        │ • Error Handling    │    │
│  └─────────────────────┘        └─────────────────────┘    │
│           │                               │                 │
│           └───────────────┬───────────────┘                 │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Core Processing Engine                     │
│  │  ┌─────────────────────────────────────────────────────┤
│  │  │ Image Processing (mapCanvas.jsworker)               │
│  │  │ • Color Space Conversion (RGB ↔ LAB)               │
│  │  │ • Color Matching Algorithm                         │
│  │  │ • Dithering Algorithms                             │
│  │  │ • Image Resizing                                   │
│  │  └─────────────────────────────────────────────────────┤
│  │  │ NBT Generation (nbt.jsworker)                      │
│  │  │ • 3D Structure Generation                          │
│  │  │ • NBT File Format Writing                          │
│  │  │ • Block Palette Management                         │
│  │  │ • Support Block Logic                              │
│  │  └─────────────────────────────────────────────────────┤
│  └─────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────┤
│                  Configuration Layer                        │
│  • Block Color Definitions (coloursJSON.json)              │
│  • Minecraft Version Support (supportedVersions.json)       │
│  • Dithering Methods (ditherMethods.json)                  │
│  • Map Generation Modes (mapModes.json)                    │
│  • Support Block Modes (whereSupportBlocksModes.json)      │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### CLI Processing Pipeline

1. **Input Validation**
   - Validate command line arguments
   - Check file existence and permissions
   - Validate Minecraft version compatibility

2. **Image Preprocessing**
   - Load image using Sharp library
   - Resize to 16x16 pixels (nearest neighbor)
   - Convert to RGBA buffer format

3. **Block Selection**
   - Determine "Everything" preset (all available blocks for target version)
   - Filter blocks based on version compatibility
   - Build block selection mapping

4. **Image Processing**
   - Apply color space conversion (RGB to LAB if better color enabled)
   - Find closest matching Minecraft block colors
   - Apply selected dithering algorithm
   - Generate material usage statistics

5. **NBT Structure Generation**
   - Create 3D block layout with staircasing
   - Generate block palette
   - Apply support block logic
   - Build NBT compound structure

6. **Output Generation**
   - Serialize NBT data to binary format
   - Apply gzip compression
   - Write to output file

### Web Interface Flow

1. **User Interface**
   - File upload and drag-drop
   - Real-time settings adjustment
   - Live preview generation

2. **Processing**
   - Similar to CLI but with progress reporting
   - Web worker architecture for non-blocking UI
   - Canvas-based preview rendering

3. **Output**
   - Download generated files
   - Multiple format support (NBT, map.dat)

## Key Design Patterns

### Worker Architecture
- Core processing logic isolated in "worker" modules
- Shared between web and CLI interfaces
- Stateless functions with explicit parameter passing

### Configuration-Driven Design
- JSON configuration files define behavior
- Version-specific block definitions
- Extensible algorithm definitions

### Functional Pipeline
- Clear data transformation steps
- Immutable data flow where possible
- Error handling at each stage

## Technology Integration

### Image Processing
- **Sharp**: High-performance image resizing and format conversion
- **Custom algorithms**: Color space conversion and matching

### NBT Generation
- **Custom NBT writer**: Binary format serialization
- **Compression**: Gzip compression for output files

### CLI Framework
- **Yargs**: Command line argument parsing and validation
- **Node.js filesystem**: File I/O operations 