# Data Flow and Entity Model

## Core Data Entities

### Image Data
```
Input Image (Any Format)
    ↓ [Sharp Processing]
RGBA Buffer (16x16 × 4 bytes)
    ↓ [Color Processing]
Processed Pixel Buffer (Minecraft Colors)
```

### Color Mapping
```
ColourSet {
  colourSetId: string,           // Unique identifier (e.g., "wool_white")
  tonesRGB: {
    normal: [r, g, b],          // Base color
    dark: [r, g, b],            // Darker shade (for depth)
    light: [r, g, b],           // Lighter shade (for height)
    unobtainable?: [r, g, b]    // Special shade (map.dat only)
  },
  blocks: {
    blockId: {
      NBTName: string,          // Minecraft block name
      validVersions: {},        // Version compatibility
      supportBlockMandatory: boolean,
      presetIndex: number       // Priority in "Everything" preset
    }
  }
}
```

### Block Selection
```
SelectedBlocks {
  [colourSetId]: blockId | "-1"  // Maps color to chosen block or "none"
}
```

### Processing Options
```
ProcessingOptions {
  optionValue_modeNBTOrMapdat: number,     // Output format (NBT vs mapdat)
  optionValue_staircasing: number,         // 3D effect mode
  optionValue_dithering: number,           // Dithering algorithm
  optionValue_betterColour: boolean,       // Use LAB vs RGB color space
  optionValue_whereSupportBlocks: number,  // Support block placement
  optionValue_version: VersionData,        // Target Minecraft version
  optionValue_supportBlock: string         // Support block type
}
```

### NBT Structure
```
NBT_json {
  blocks: [{                    // Block placement data
    pos: [x, y, z],
    state: paletteIndex
  }],
  palette: [{                   // Block type definitions
    Name: "minecraft:block_name",
    Properties?: { key: value }
  }],
  size: [width, height, depth], // Structure dimensions
  author: string,
  DataVersion: number           // Minecraft data version
}
```

## Data Transformation Pipeline

### 1. CLI Input Processing
```
Command Line Args
    ↓ [Yargs Parsing]
Validated Arguments {
  image: string,
  output: string,
  mcversion: string,
  staircasing: string,
  dithering: string,
  supportBlock: string,
  supportMode: string,
  betterColour: boolean
}
    ↓ [JSON Config Loading]
Configuration Objects {
  coloursJSON,
  supportedVersions,
  MapModes,
  DitherMethods,
  WhereSupportBlocksModes
}
    ↓ [Validation & ID Resolution]
Processing Options Object
```

### 2. Block Selection Generation
```
ColoursJSON + Target Version
    ↓ [Version Compatibility Check]
Available Blocks per ColorSet
    ↓ ["Everything" Preset Logic]
Selected Blocks {
  [colourSetId]: bestBlockId  // Lowest presetIndex that's valid
}
```

### 3. Image Processing Flow
```
Input Image File
    ↓ [Sharp.resize(16x16, nearest)]
RGBA Buffer (1024 bytes)
    ↓ [processImageData()]
{
  processedPixels: RGBA Buffer,  // Colors matched to Minecraft blocks
  maps: [{                       // Material usage statistics
    materials: { [colourSetId]: count }
  }]
}
```

### 4. Color Matching Algorithm
```
For each pixel(x,y):
  oldPixel = [r, g, b] from input
    ↓ [Apply Dithering Error if applicable]
  adjustedPixel = oldPixel + errorDiffusion
    ↓ [Find Closest Color]
  closestColor = findClosest(adjustedPixel, availableColors, colorSpace)
    ↓ [Update Output]
  outputPixel = closestColor.rgb
  materials[closestColor.colourSetId]++
    ↓ [Calculate Error for Dithering]
  quantError = adjustedPixel - outputPixel
    ↓ [Distribute Error to Neighbors]
  distributeError(quantError, ditherMatrix)
```

### 5. NBT Structure Generation
```
Processed Image Data + Options
    ↓ [Map_NBT Constructor]
NBT Instance {
  mapColoursLayout: [[]],      // 16x16 grid of {colourSetId, tone}
  palette_mappings: {},         // Color to palette index mapping
  NBT_json: {}                 // NBT structure
}
    ↓ [constructPaletteLookups()]
Palette Mappings
    ↓ [setNBT_json_palette()]
NBT Palette Definition
    ↓ [getPhysicalLayout()]
3D Block Coordinates
    ↓ [setNBT_json_blocks()]
NBT Block Placement
    ↓ [getNBT()]
ArrayBuffer (Binary NBT)
    ↓ [gzip compression]
Compressed NBT File
```

## Data Storage Layers

### Configuration Files (JSON)
- **coloursJSON.json**: 269KB master database of all block colors and properties
- **supportedVersions.json**: Version to NBT data version mapping
- **mapModes.json**: Output format definitions and staircasing modes
- **ditherMethods.json**: Dithering algorithm definitions and matrices
- **whereSupportBlocksModes.json**: Support block placement strategies

### Runtime Memory Structures
- **exactColourCache**: Map of RGB values to {colourSetId, tone} for exact lookups
- **colourCache**: Map of RGB values to closest color matches (with caching)
- **labCache**: Map of RGB values to LAB color space equivalents
- **errorDiffusionMatrix**: 2D array for storing dithering errors

### Output Formats
- **NBT Files**: Gzipped binary files containing Minecraft schematic data
- **Map.dat Files**: Direct Minecraft map data files (web interface only)

## Key Data Journeys

### "Everything" Preset Resolution
```
For each colorSet in coloursJSON:
  validBlocks = filterByVersion(colorSet.blocks, targetVersion)
  bestBlock = findLowestPresetIndex(validBlocks)
  selectedBlocks[colorSetId] = bestBlock || "-1"
```

### Color Space Conversion (LAB Mode)
```
RGB [0-255] → Linear RGB [0-1] → XYZ → LAB
- More perceptually accurate color matching
- Cached for performance (rgb2lab function)
- Used in squaredEuclideanMetricColours when betterColour=true
```

### Staircasing Generation
```
16x16 Color Layout
    ↓ [Apply Staircasing Rules]
3D Block Coordinates with Heights
- normal tone: height 0
- light tone: height +1 (raised)
- dark tone: height -1 (lowered)
- Support blocks placed as needed
``` 