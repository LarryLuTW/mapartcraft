# CLI Deep Dive: How mapart-cli.js Works

## Overview

The `mapart-cli.js` tool is a Node.js command-line application that converts any image file into a Minecraft NBT schematic file containing a 16x16 block structure suitable for display on in-game maps. This document provides a comprehensive technical analysis of how the CLI tool works.

## Entry Point and Structure

### Script Setup
```javascript
#!/usr/bin/env node
```
- Shebang line allows direct execution on Unix-like systems
- Node.js runtime required (minimum v14.x)

### Core Dependencies
```javascript
const fs = require('fs');           // File system operations
const path = require('path');       // Path manipulation
const zlib = require('zlib');       // Gzip compression
const sharp = require('sharp');     // Image processing
const yargs = require('yargs/yargs'); // CLI argument parsing
```

## Command Line Interface Analysis

### Argument Definition
The CLI uses yargs to define a comprehensive set of options:

```javascript
const parser = yargs(hideBin(process.argv))
  .usage('Usage: $0 --image <path> --output <path> [--mcversion <mc_version_key>] [options]')
```

#### Required Arguments
- `--image` (`-i`): Input image file path
- `--output` (`-o`): Output NBT file path

#### Configuration Arguments
- `--mcversion`: Target Minecraft version (default: "1_20")
- `--staircasing`: 3D effect mode (default: "VALLEY")
- `--dithering`: Color diffusion algorithm (default: "FloydSteinberg")
- `--supportBlock`: Block type for structural support (default: "cobblestone")
- `--supportMode`: Support block placement strategy (default: "ALL_OPTIMIZED")
- `--betterColour`: Use LAB vs RGB color space (default: true)

### Validation Process
The tool performs extensive validation:
1. **Version Validation**: Checks if `mcversion` exists in `supportedVersions.json`
2. **Mode Validation**: Validates staircasing mode against `mapModes.json`
3. **Algorithm Validation**: Ensures dithering method exists in `ditherMethods.json`
4. **File Validation**: Implicit validation through Sharp's image loading

## Configuration Loading System

### JSON Configuration Files
The CLI loads five critical configuration files:

```javascript
const coloursJSON = loadJson('./src/components/mapart/json/coloursJSON.json');
const supportedVersions = loadJson('./src/components/mapart/json/supportedVersions.json');
const MapModes = loadJson('./src/components/mapart/json/mapModes.json');
const DitherMethods = loadJson('./src/components/mapart/json/ditherMethods.json');
const WhereSupportBlocksModes = loadJson('./src/components/mapart/json/whereSupportBlocksModes.json');
```

### Configuration Resolution
Each configuration value is resolved to an internal ID:
```javascript
const optionValue_version = supportedVersions[versionKey];
const optionValue_staircasing = selectedStaircasingMode.uniqueId;
const optionValue_dithering = selectedDitherMethod.uniqueId;
const optionValue_whereSupportBlocks = selectedSupportMode.uniqueId;
```

## Block Selection Algorithm: "Everything" Preset

One of the most complex parts of the CLI is automatically determining which blocks to use for each color set. This implements the "Everything" preset logic:

### Selection Logic
```javascript
const selectedBlocks = {};
for (const colourSetId in coloursJSON) {
    let defaultBlockId = "-1"; // Default to "none"
    let minPresetIndex = Infinity;

    for (const blockId in coloursJSON[colourSetId].blocks) {
        const blockData = coloursJSON[colourSetId].blocks[blockId];
        
        // Version compatibility check
        let currentVersionData = blockData.validVersions[optionValue_version.MCVersion];
        let isValid = !!currentVersionData;

        // Handle version references (e.g., "&1.12.2")
        if (typeof currentVersionData === 'string' && currentVersionData.startsWith('&')) {
            isValid = !!blockData.validVersions[currentVersionData.slice(1)];
        }

        // Find block with lowest presetIndex that's valid for target version
        if (isValid && blockData.hasOwnProperty('presetIndex') && blockData.presetIndex < minPresetIndex) {
            minPresetIndex = blockData.presetIndex;
            defaultBlockId = blockId;
            if (minPresetIndex === 0) break; // Prefer index 0 if found
        }
    }
    
    selectedBlocks[colourSetId] = defaultBlockId;
}
```

### Fallback Strategy
If no block with a `presetIndex` is found valid, the algorithm tries to find any valid block:
```javascript
if (defaultBlockId === "-1" && minPresetIndex === Infinity) {
    // Find any valid block as fallback
    for (const blockId in coloursJSON[colourSetId].blocks) {
        // Check validity and use first valid block found
    }
}
```

## Image Processing Pipeline

### Step 1: Image Loading and Preprocessing
```javascript
const { data: rgbaBuffer, info } = await sharp(argv.image)
  .resize(16, 16, { kernel: sharp.kernel.nearest })
  .ensureAlpha() // Ensure 4 channels (RGBA)
  .raw()
  .toBuffer({ resolveWithObject: true });
```

**Key Details:**
- Forces 16x16 pixel size for NBT compatibility
- Uses nearest neighbor interpolation to preserve pixel art aesthetics
- Ensures RGBA format (4 bytes per pixel)
- Returns raw pixel data as Buffer

### Step 2: Core Image Processing
The CLI calls the shared `processImageData` function from `mapCanvas.jsworker`:

```javascript
const processOptions = {
  coloursJSON,
  MapModes,
  DitherMethods,
  selectedBlocks,
  optionValue_modeNBTOrMapdat: MapModes.SCHEMATIC_NBT.uniqueId, // Force NBT mode
  optionValue_staircasing,
  optionValue_betterColour: argv.betterColour,
  optionValue_dithering,
};
const processResult = processImageData(rgbaBuffer, 16, 16, processOptions);
```

### Image Processing Details
The `processImageData` function performs:
1. **Color Cache Setup**: Creates lookup caches for performance
2. **Color Set Filtering**: Determines which colors are available based on selected blocks
3. **Pixel-by-Pixel Processing**: For each of the 256 pixels:
   - Apply dithering error from neighbors (if applicable)
   - Find closest matching Minecraft block color
   - Update output pixel with Minecraft color
   - Calculate and distribute quantization error for dithering
   - Update material usage statistics

## Color Matching and Dithering

### Color Space Selection
The CLI supports two color matching modes:
- **RGB Mode** (`betterColour: false`): Direct RGB distance calculation
- **LAB Mode** (`betterColour: true`): Perceptually uniform color space

### Dithering Algorithm Selection
Different algorithms are applied based on the `dithering` option:

#### Error Diffusion Methods
- Floyd-Steinberg, Burkes, Sierra Lite, Stucki, Atkinson
- Distribute quantization error to neighboring pixels
- Use error diffusion matrices defined in configuration

#### Matrix-Based Methods  
- Bayer 2x2, Bayer 4x4, Ordered 3x3
- Use pre-defined matrices for threshold-based dithering
- Compare color distances to determine pixel choice

## NBT Structure Generation

### Step 3: Color Layout Preparation
The CLI maps processed pixels back to color/tone combinations:

```javascript
const exactColourCache = setupExactColourCache(coloursJSON);
const coloursLayout = Array.from({ length: 16 }, () => []); // 16 columns

for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
        const idx = (y * 16 + x) * 4;
        const r = processedPixels[idx];
        const g = processedPixels[idx + 1];
        const b = processedPixels[idx + 2];
        
        const rgbBinary = (r << 16) + (g << 8) + b;
        const colourSetIdAndTone = exactColourCache.get(rgbBinary);
        
        coloursLayout[x].push(colourSetIdAndTone);
    }
}
```

### Step 4: NBT Structure Creation
The CLI creates a `Map_NBT` instance and configures it:

```javascript
const mapInput = {
    coloursLayout: coloursLayout,
    materials: processedMaps[0][0].materials
};

const nbtOptions = {
  coloursJSON,
  optionValue_version,
  optionValue_staircasing,
  optionValue_whereSupportBlocks,
  optionValue_supportBlock: argv.supportBlock,
  currentSelectedBlocks: selectedBlocks,
  MapModes: MapModes,
  WhereSupportBlocksModes: WhereSupportBlocksModes
};

const mapNbtInstance = new Map_NBT(mapInput, nbtOptions);
```

### NBT Generation Process
The `Map_NBT` class performs these steps:
1. **Palette Construction**: Build list of unique blocks used
2. **3D Layout Generation**: Apply staircasing rules to create height variations
3. **Support Block Logic**: Add structural support blocks where needed
4. **NBT Serialization**: Convert to binary NBT format

## File Output Process

### Step 5: NBT Compilation and Compression
```javascript
const nbtArrayBuffer = mapNbtInstance.getNBT(); // Returns ArrayBuffer
const nbtBuffer = Buffer.from(nbtArrayBuffer); // Convert to Node Buffer
const compressedNbt = zlib.gzipSync(nbtBuffer); // Gzip compression
```

### Step 6: File Writing
```javascript
const outputDir = path.dirname(argv.output);
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true }); // Create directories if needed
}
fs.writeFileSync(argv.output, compressedNbt);
```

## Error Handling Strategy

### Validation Errors
- Invalid command line arguments result in help display and exit code 1
- Missing files or unsupported formats cause immediate termination
- Configuration validation happens early to fail fast

### Processing Errors
- Image processing failures are caught and reported with context
- NBT generation errors include diagnostic information
- File I/O errors provide clear filesystem feedback

### Graceful Degradation
- Missing color matches fall back to black/air blocks
- Invalid dithering configurations fall back to no dithering
- Version reference resolution includes fallback mechanisms

## Performance Characteristics

### Memory Usage
- Input image loaded entirely into memory as RGBA buffer (16x16 = 1KB)
- Color caches use Map data structures for O(1) lookups
- NBT writer uses auto-resizing buffers starting at 1KB

### Computational Complexity
- Color matching: O(n × m) where n = pixels, m = available colors
- Dithering: O(n × k) where k = neighbors in error diffusion matrix
- NBT generation: O(n) for structure traversal

### I/O Operations
- Sequential file reads for configuration loading
- Single image load operation via Sharp
- Single compressed file write for output

## CLI Success Flow Summary

1. **Argument Parsing**: Validate and normalize user inputs
2. **Configuration Loading**: Load JSON definitions and resolve IDs
3. **Block Selection**: Determine "Everything" preset automatically
4. **Image Preprocessing**: Load and resize image to 16x16 RGBA
5. **Color Processing**: Match pixels to Minecraft colors with dithering
6. **Layout Mapping**: Convert processed pixels back to color/tone data
7. **NBT Generation**: Create 3D structure with staircasing and support blocks
8. **Compression**: Apply gzip compression to binary NBT data
9. **File Output**: Write compressed NBT file to specified location

The entire process typically completes in under a second for a 16x16 output, making it suitable for both interactive use and batch processing scenarios. 