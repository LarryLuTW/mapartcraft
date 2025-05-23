#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sharp = require('sharp');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// For ES6 import compatibility, we'll need to load NBTReader differently
async function loadNBTReader() {
  const module = await import('./src/components/mapart/nbtReader.js');
  return module.default;
}

// --- Configuration and Argument Parsing ---

const parser = yargs(hideBin(process.argv))
  .usage('Usage: $0 --nbt <path> --output <path> [--mcversion <mc_version_key>] [options]')
  .option('nbt', {
    alias: 'n',
    description: 'Path to the input NBT schematic file',
    type: 'string',
    demandOption: true,
  })
  .option('output', {
    alias: 'o', 
    description: 'Path to save the output PNG file',
    type: 'string',
    demandOption: true,
  })
  .option('mcversion', {
    description: 'Target Minecraft version key (e.g., "1_20", "1_19")',
    type: 'string',
    default: '1_20',
    demandOption: false,
  })
  .option('extractTone', {
    description: 'Which tone to extract (normal, light, dark, or auto)',
    type: 'string',
    default: 'auto',
    choices: ['normal', 'light', 'dark', 'auto']
  })
  .help()
  .alias('help', 'h');

const argv = parser.parse();

// --- Load JSON Data ---

function loadJson(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    console.log(`Loading JSON: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading JSON file ${filePath}:`, error);
    process.exit(1);
  }
}

const coloursJSON = loadJson('./src/components/mapart/json/coloursJSON.json');
const supportedVersions = loadJson('./src/components/mapart/json/supportedVersions.json');

// --- Validate Inputs ---

// Validate the provided version key
if (!supportedVersions[argv.mcversion]) {
  console.error(`Error: Unsupported Minecraft version key "${argv.mcversion}".`);
  console.error(`Supported version keys: ${Object.keys(supportedVersions).join(', ')}`);
  process.exit(1);
}
const optionValue_version = supportedVersions[argv.mcversion];

// --- Helper Functions ---

// Create a mapping from block names to color sets
function createBlockToColorMapping(coloursJSON, targetVersion) {
  const blockToColor = new Map();
  
  for (const [colourSetId, colourSet] of Object.entries(coloursJSON)) {
    for (const [blockId, blockData] of Object.entries(colourSet.blocks)) {
      // Check if block is valid for the target version
      let versionData = blockData.validVersions[targetVersion.MCVersion];
      
      // Handle version references (e.g., "&1.12.2")
      while (typeof versionData === 'string' && versionData.startsWith('&')) {
        const referencedVersion = versionData.slice(1);
        versionData = blockData.validVersions[referencedVersion];
      }
      
      if (versionData && typeof versionData === 'object' && versionData.NBTName) {
        const blockName = `minecraft:${versionData.NBTName}`;
        if (!blockToColor.has(blockName)) {
          blockToColor.set(blockName, []);
        }
        blockToColor.get(blockName).push({
          colourSetId,
          blockId,
          properties: versionData.NBTArgs || {}
        });
      }
    }
  }
  
  return blockToColor;
}

// Match block properties to find the best color match
function matchBlockProperties(block, candidateBlocks, properties) {
  // If no properties specified, take the first candidate
  if (!properties || Object.keys(properties).length === 0) {
    return candidateBlocks[0];
  }
  
  // Find exact property match
  for (const candidate of candidateBlocks) {
    const candidateProps = candidate.properties;
    let matches = true;
    
    for (const [key, value] of Object.entries(properties)) {
      if (candidateProps[key] !== value) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      return candidate;
    }
  }
  
  // If no exact match, return first candidate
  return candidateBlocks[0];
}

// Determine the best tone based on block height in the structure
function determineToneFromHeight(x, z, physicalLayout, toneMode) {
  if (toneMode !== 'auto') {
    return toneMode;
  }
  
  // Auto mode: analyze the structure to determine tone based on height
  const baseHeight = 0; // Assume y=0 is the base level
  let blockHeight = null;
  
  // Find the block at this x,z position
  for (const block of physicalLayout) {
    if (block.x === x && block.z === z) {
      blockHeight = block.y;
      break;
    }
  }
  
  if (blockHeight === null) {
    return 'normal'; // Default fallback
  }
  
  if (blockHeight > baseHeight) {
    return 'light'; // Raised blocks -> light tone
  } else if (blockHeight < baseHeight) {
    return 'dark'; // Lowered blocks -> dark tone
  } else {
    return 'normal'; // Base level -> normal tone
  }
}

// Convert NBT structure to 16x16 pixel layout
function extractPixelLayout(nbtData, blockToColorMapping, toneMode) {
  console.log('Extracting pixel layout from NBT structure...');
  
  // Parse NBT structure
  const palette = nbtData.value.palette.value.value;
  const blocks = nbtData.value.blocks.value.value;
  const size = nbtData.value.size.value.value; // [width, height, depth]
  
  console.log(`Structure size: ${size[0]}x${size[1]}x${size[2]}`);
  console.log(`Found ${palette.length} blocks in palette`);
  console.log(`Found ${blocks.length} blocks in structure`);
  
  // Create a physical layout of all blocks
  const physicalLayout = blocks.map(block => {
    const pos = block.pos.value.value;
    const state = block.state.value;
    const paletteEntry = palette[state];
    
    return {
      x: pos[0],
      y: pos[1], 
      z: pos[2],
      blockName: paletteEntry.Name.value,
      properties: paletteEntry.Properties ? 
        Object.fromEntries(
          Object.entries(paletteEntry.Properties.value).map(([k, v]) => [k, v.value])
        ) : {}
    };
  });
  
  // Create 16x16 pixel array
  const pixels = Array(16).fill(null).map(() => Array(16).fill(null));
  
  // Map each x,z position to the appropriate color
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      // Find blocks at this x,z position
      const blocksAtPosition = physicalLayout.filter(block => 
        block.x === x && block.z === z
      );
      
      if (blocksAtPosition.length === 0) {
        // No block at this position, use air (black)
        pixels[z][x] = { r: 0, g: 0, b: 0, a: 255 };
        continue;
      }
      
      // Sort by height to get the topmost non-air block
      blocksAtPosition.sort((a, b) => b.y - a.y);
      
      let targetBlock = null;
      for (const block of blocksAtPosition) {
        if (block.blockName !== 'minecraft:air') {
          targetBlock = block;
          break;
        }
      }
      
      if (!targetBlock) {
        // Only air blocks at this position
        pixels[z][x] = { r: 0, g: 0, b: 0, a: 255 };
        continue;
      }
      
      // Find color mapping for this block
      const candidateColors = blockToColorMapping.get(targetBlock.blockName);
      if (!candidateColors || candidateColors.length === 0) {
        console.warn(`No color mapping found for block: ${targetBlock.blockName}`);
        pixels[z][x] = { r: 255, g: 0, b: 255, a: 255 }; // Magenta for unknown blocks
        continue;
      }
      
      // Match block properties to find the best color
      const colorMatch = matchBlockProperties(targetBlock, candidateColors, targetBlock.properties);
      
      // Determine the tone to use
      const tone = determineToneFromHeight(x, z, physicalLayout, toneMode);
      
      // Get the RGB color for this tone
      const colourSet = coloursJSON[colorMatch.colourSetId];
      let rgb;
      
      if (colourSet && colourSet.tonesRGB && colourSet.tonesRGB[tone]) {
        rgb = colourSet.tonesRGB[tone];
      } else if (colourSet && colourSet.tonesRGB && colourSet.tonesRGB.normal) {
        // Fallback to normal tone if requested tone doesn't exist
        rgb = colourSet.tonesRGB.normal;
        console.warn(`Tone '${tone}' not available for ${colorMatch.colourSetId}, using normal`);
      } else {
        console.warn(`No RGB data found for ${colorMatch.colourSetId}`);
        rgb = [255, 0, 255]; // Magenta fallback
      }
      
      pixels[z][x] = { r: rgb[0], g: rgb[1], b: rgb[2], a: 255 };
    }
  }
  
  return pixels;
}

// Convert pixel layout to RGBA buffer for Sharp
function pixelsToBuffer(pixels) {
  const buffer = Buffer.alloc(16 * 16 * 4); // 16x16 RGBA
  let offset = 0;
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const pixel = pixels[y][x];
      buffer[offset++] = pixel.r;
      buffer[offset++] = pixel.g;
      buffer[offset++] = pixel.b;
      buffer[offset++] = pixel.a;
    }
  }
  
  return buffer;
}

// --- Main Logic ---

async function run() {
  try {
    console.log(`Processing NBT file: ${argv.nbt}`);
    console.log(`Target version: ${argv.mcversion}`);
    console.log(`Output file: ${argv.output}`);
    console.log(`Extract tone: ${argv.extractTone}`);

    // 1. Load NBTReader class
    const NBTReader = await loadNBTReader();

    // 2. Read and decompress NBT file
    console.log('Reading NBT file...');
    if (!fs.existsSync(argv.nbt)) {
      throw new Error(`NBT file not found: ${argv.nbt}`);
    }
    
    const compressedData = fs.readFileSync(argv.nbt);
    const decompressedData = zlib.gunzipSync(compressedData);
    
    // 3. Parse NBT data
    console.log('Parsing NBT structure...');
    const nbtReader = new NBTReader();
    nbtReader.loadBuffer(decompressedData.buffer);
    const nbtData = nbtReader.getData();
    
    console.log(`NBT structure name: ${nbtData.name}`);
    
    // 4. Create block to color mapping
    console.log('Creating block to color mapping...');
    const blockToColorMapping = createBlockToColorMapping(coloursJSON, optionValue_version);
    console.log(`Found ${blockToColorMapping.size} unique block types in color database`);
    
    // 5. Extract pixel layout from NBT
    const pixels = extractPixelLayout(nbtData, blockToColorMapping, argv.extractTone);
    
    // 6. Convert to image buffer
    console.log('Converting to image...');
    const imageBuffer = pixelsToBuffer(pixels);
    
    // 7. Save as PNG
    console.log('Saving PNG file...');
    const outputDir = path.dirname(argv.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    await sharp(imageBuffer, {
      raw: {
        width: 16,
        height: 16,
        channels: 4
      }
    })
    .png()
    .toFile(argv.output);
    
    console.log(`✅ Successfully converted NBT to PNG: ${argv.output}`);

  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

run(); 