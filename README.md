# MapartCraft

MapartCraft is a tool for creating Minecraft map art from images. It provides both a web interface and command-line tools for converting images to NBT schematics and map.dat files.

## Features

- **Image to NBT Conversion**: Convert any image to a 16x16 Minecraft schematic
- **NBT to Image Conversion**: Extract images from existing NBT schematics  
- **Multiple Minecraft Versions**: Support for Minecraft 1.12.2 through 1.20+
- **Advanced Color Processing**: LAB color space matching for perceptually accurate results
- **Dithering Algorithms**: Multiple dithering methods including Floyd-Steinberg, Bayer matrices
- **3D Staircasing**: Create depth effects with raised and lowered blocks
- **Web Interface**: User-friendly browser-based editor with 3D preview

## Command Line Tools

### Image to NBT Conversion

Convert images to Minecraft NBT schematic files:

```bash
./mapart-cli.js --image input.png --output output.nbt [options]
```

**Options:**
- `--image, -i`: Input image file path (required)
- `--output, -o`: Output NBT file path (required)  
- `--mcversion`: Minecraft version ("1_20", "1_19", etc.) [default: "1_20"]
- `--staircasing`: 3D effect mode ("OFF", "CLASSIC", "VALLEY", "FULL_DARK", "FULL_LIGHT") [default: "VALLEY"]
- `--dithering`: Dithering algorithm ("None", "FloydSteinberg", "Bayer44", etc.) [default: "FloydSteinberg"]
- `--supportBlock`: Support block type [default: "cobblestone"]
- `--supportMode`: Support placement ("NONE", "ALL", "ALL_OPTIMIZED", "MANDATORY_ONLY") [default: "ALL_OPTIMIZED"]
- `--betterColour`: Use LAB color space (true/false) [default: true]

**Example:**
```bash
./mapart-cli.js --image photo.jpg --output my-mapart.nbt --mcversion 1_20 --staircasing VALLEY
```

### NBT to Image Conversion

Extract 16x16 PNG images from NBT schematic files:

```bash
./nbt-to-png-cli.js --nbt input.nbt --output output.png [options]
```

**Options:**
- `--nbt, -n`: Input NBT schematic file path (required)
- `--output, -o`: Output PNG file path (required)
- `--mcversion`: Minecraft version for block interpretation [default: "1_20"]  
- `--extractTone`: Tone extraction mode ("normal", "light", "dark", "auto") [default: "auto"]

**Tone Extraction Modes:**
- `auto`: Automatically determine tone based on block height (recommended)
- `normal`: Extract base colors only
- `light`: Extract light tones (for raised blocks)
- `dark`: Extract dark tones (for lowered blocks)

**Example:**
```bash
./nbt-to-png-cli.js --nbt my-mapart.nbt --output extracted-image.png --extractTone auto
```

## Installation

### Prerequisites
- Node.js 14.x or higher
- npm

### Setup
```bash
git clone https://github.com/rebane2001/mapartcraft.git
cd mapartcraft
npm install
```

### Make CLI tools executable
```bash
chmod +x mapart-cli.js nbt-to-png-cli.js
```

## Web Interface

Start the development server:
```bash
npm start
```

Build for production:
```bash
npm run build
```

## Supported Formats

### Input Formats (Image to NBT)
- PNG, JPEG, WebP, TIFF, GIF, SVG
- Automatically resized to 16x16 pixels

### Output Formats
- **NBT Schematics**: 3D structures compatible with WorldEdit, MCEdit
- **PNG Images**: Standard 16x16 pixel images

### Minecraft Versions
- 1.20+, 1.19, 1.18, 1.17, 1.16, 1.15, 1.14, 1.13, 1.12.2

## Technical Details

### Color Processing
- 269KB block color database with ~8,500 block definitions
- LAB color space conversion for perceptually accurate matching
- Multiple dithering algorithms to improve visual quality
- Support for transparency in map.dat format

### NBT Structure
- Gzipped binary NBT format
- 16x16 base with configurable height variations
- Automatic palette generation and optimization
- Support block placement for structural integrity

### Performance
- CLI processing typically completes in under 1 second
- Memory-efficient buffer management
- Optimized color lookup caches

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read the contributing guidelines and submit pull requests.

## Links

- **Web Version**: [rebane2001.com/mapartcraft](https://rebane2001.com/mapartcraft)
- **GitHub**: [github.com/rebane2001/mapartcraft](https://github.com/rebane2001/mapartcraft)
