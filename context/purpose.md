# Project Purpose

## Problem Statement
MapartCraft is a tool designed to solve the problem of creating pixel art in Minecraft that can be displayed on in-game maps. Players want to convert their images into Minecraft map art, but manually placing blocks to match colors is time-consuming and often produces poor results due to the limited color palette available in Minecraft.

## Solution
MapartCraft provides two main solutions:

1. **Web Application**: A React-based web interface that allows users to upload images and convert them to Minecraft map art with real-time preview
2. **Command Line Interface (CLI)**: Node.js CLI tools for processing images and NBT files:
   - `mapart-cli.js`: Converts images to NBT schematic files
   - `nbt-to-png-cli.js`: Extracts 16x16 PNG images from NBT schematic files

## Core Value Propositions

### Bidirectional Conversion
- **Image → NBT**: Convert any image to a Minecraft schematic with optimal block selection
- **NBT → Image**: Extract the visual representation from existing NBT schematics
- **Round-trip Compatibility**: Process images through NBT format and back to verify results

### Color Optimization
- Matches input image colors to the nearest available Minecraft block colors
- Supports different color comparison methods (RGB vs LAB color space for more accurate perception-based matching)
- Handles multiple Minecraft versions with different available blocks

### Advanced Image Processing
- Implements multiple dithering algorithms (Floyd-Steinberg, Bayer, etc.) to improve visual quality when color palette is limited
- Supports transparency handling for .mapdat files
- Resizes images appropriately (16x16 for NBT schematics, 128x128 for map.dat files)

### 3D Structure Generation
- Creates 3D block structures with staircasing effects (classic, valley, full dark/light modes)
- Generates support blocks where needed for structural integrity
- Produces NBT schematic files compatible with WorldEdit and other Minecraft tools

### Multi-Format Support
- **NBT Schematics**: 16x16 3D structures for building in-world
- **Map.dat files**: Direct map data files for existing in-game maps
- **PNG Images**: Standard image format for viewing and sharing
- Supports multiple Minecraft versions from 1.12.2 to 1.20+

## Target Users
- Minecraft players who want to create custom map art
- Server administrators who need to generate map art programmatically
- Content creators who want to incorporate custom images into their Minecraft builds
- Developers who need to integrate map art generation into other tools
- Players who want to analyze or extract images from existing NBT schematics 