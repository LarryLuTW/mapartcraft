# Interface Documentation

## CLI Interface (`mapart-cli.js`)

### Command Line Interface
```bash
./mapart-cli.js --image <path> --output <path> [options]
```

#### Required Arguments
- `--image` (`-i`): Path to input image file
- `--output` (`-o`): Path for output NBT file

#### Optional Arguments
- `--mcversion`: Minecraft version key (default: "1_20")
- `--staircasing`: Staircasing mode (default: "VALLEY")
- `--dithering`: Dithering algorithm (default: "FloydSteinberg")
- `--supportBlock`: Support block NBT name (default: "cobblestone")
- `--supportMode`: Support block placement mode (default: "ALL_OPTIMIZED")
- `--betterColour`: Use LAB color space (default: true)

## Core Processing Interfaces

### processImageData Function
```javascript
function processImageData(imageData, width, height, options)
```

#### Parameters
- `imageData`: Buffer - RGBA pixel data (4 bytes per pixel)
- `width`: number - Image width in pixels
- `height`: number - Image height in pixels
- `options`: ProcessingOptions - Configuration object

#### ProcessingOptions Interface
```javascript
{
  coloursJSON: Object,                    // Color and block definitions
  MapModes: Object,                       // Output format configurations
  DitherMethods: Object,                  // Dithering algorithm definitions
  selectedBlocks: Object,                 // Block selection mapping
  optionValue_modeNBTOrMapdat: number,   // Output format ID
  optionValue_staircasing: number,        // Staircasing mode ID
  optionValue_betterColour: boolean,      // Color space preference
  optionValue_dithering: number          // Dithering algorithm ID
}
```

#### Return Value
```javascript
{
  processedPixels: Buffer,    // RGBA buffer with Minecraft colors
  maps: [{                    // Material usage data
    materials: {
      [colourSetId]: number   // Count of each color used
    }
  }]
}
```

### Map_NBT Class Interface
```javascript
class Map_NBT {
  constructor(map, options)
  constructPaletteLookups()
  setNBT_json_palette()
  setNBT_json_DataVersion()
  getPhysicalLayout()
  setNBT_json_blocks()
  setNBT_json_size()
  getNBT(): ArrayBuffer
}
```

#### Constructor Parameters
```javascript
// map parameter
{
  coloursLayout: Array<Array<{colourSetId: string, tone: string}>>,
  materials: {[colourSetId]: number}
}

// options parameter
{
  coloursJSON: Object,
  optionValue_version: {MCVersion: string, NBTVersion: number},
  optionValue_staircasing: number,
  optionValue_whereSupportBlocks: number,
  optionValue_supportBlock: string,
  currentSelectedBlocks: {[colourSetId]: blockId},
  MapModes: Object,
  WhereSupportBlocksModes: Object
}
```

### NBTWriter Class Interface
```javascript
class NBTWriter {
  constructor()
  writeByType(dataType: TagTypes, value: any)
  encodeUTF8(str: string): number[]
  accommodate(size: number)
  write(dataType: string, size: number, value: any)
}
```

#### TagTypes Constants
```javascript
const TagTypes = {
  end: 0,
  byte: 1,
  short: 2,
  int: 3,
  long: 4,
  float: 5,
  double: 6,
  byteArray: 7,
  string: 8,
  list: 9,
  compound: 10,
  intArray: 11,
  longArray: 12
}
```

## Configuration File Interfaces

### coloursJSON.json Structure
```javascript
{
  [colourSetId]: {
    tonesRGB: {
      normal: [r, g, b],
      dark: [r, g, b],
      light: [r, g, b],
      unobtainable?: [r, g, b]
    },
    blocks: {
      [blockId]: {
        NBTName?: string,
        validVersions: {
          [version]: {
            NBTName: string,
            NBTArgs: {[key]: string}
          } | string  // Reference to another version
        },
        supportBlockMandatory?: boolean,
        presetIndex?: number
      }
    }
  }
}
```

### supportedVersions.json Structure
```javascript
{
  [versionKey]: {
    MCVersion: string,    // Display version (e.g., "1.20")
    NBTVersion: number    // Data version for NBT files
  }
}
```

### mapModes.json Structure
```javascript
{
  [modeName]: {
    uniqueId: number,
    name: string,
    staircaseModes: {
      [modeName]: {
        uniqueId: number,
        localeKey: string,
        toneKeys: string[],  // Which color tones to use
        extra: boolean       // Whether this is an "extra" mode
      }
    }
  }
}
```

### ditherMethods.json Structure
```javascript
{
  [methodName]: {
    uniqueId: number,
    ditherMatrix?: number[][],      // For matrix-based methods
    ditherDivisor?: number,         // For error diffusion methods
    matrixOffset?: [number, number] // Offset for error diffusion
  }
}
```

## Internal Helper Interfaces

### Color Processing Functions
```javascript
function rgb2lab(rgb: [number, number, number], labCache: Map): [number, number, number]

function squaredEuclideanMetricColours(
  pixel1: [number, number, number],
  pixel2: [number, number, number],
  optionValue_betterColour: boolean,
  labCache: Map
): number

function findClosestColourSetIdAndToneAndRGBTo(
  pixelRGB: [number, number, number],
  colourSetsToUse: Array,
  colourCache: Map,
  optionValue_betterColour: boolean,
  labCache: Map
): {colourSetId: string, tone: string}

function colourSetIdAndToneToRGB(
  colourSetId: string,
  tone: string,
  coloursJSON: Object
): [number, number, number]
```

### Utility Functions
```javascript
function setupColourSetsToUse(
  selectedBlocks: Object,
  MapModes: Object,
  optionValue_modeNBTOrMapdat: number,
  optionValue_staircasing: number,
  coloursJSON: Object
): Array<{colourSetId: string, tonesRGB: Object}>

function setupExactColourCache(coloursJSON: Object): Map
```

## Error Handling

### CLI Error Responses
- Exit code 1 for all errors
- Console error messages for:
  - Invalid command line arguments
  - File not found
  - Unsupported Minecraft version
  - Image processing failures
  - NBT generation failures

### Processing Error Handling
- Graceful fallbacks for invalid color matches
- Warning messages for missing block data
- Default values for missing configuration entries

## Message Contracts

### CLI Success Output
```
Processing image: <path>
Target version: <version>
Output file: <path>
Determining "Everything" block selection...
Resizing image to 16x16 (nearest neighbor)...
Image resized and raw RGBA data obtained.
Processing image data (colour matching, dithering)...
Image data processed.
Building coloursLayout for NBT structure...
ColoursLayout built.
Generating NBT structure...
NBT structure generated.
Compressing NBT data (gzip)...
✅ Successfully generated NBT file: <path>
```

### Progress Indicators
- Step-by-step console output
- Clear success/failure indicators
- File size and processing statistics 