#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sharp = require('sharp');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import refactored modules
const { processImageData } = require('./src/components/mapart/workers/mapCanvas.jsworker');
const { Map_NBT, NBTWriter, TagTypes } = require('./src/components/mapart/workers/nbt.jsworker'); // Assuming Map_NBT requires TagTypes, maybe WhereSupportBlocksModes, MapModes

// --- Utility Functions ---

// Function to check if a string is a valid URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Function to download image from URL
async function downloadImage(url) {
  console.log(`Downloading image from URL: ${url}`);
  
  try {
    // Check if fetch is available (Node.js 18+)
    if (typeof fetch === 'undefined') {
      throw new Error('URL support requires Node.js 18+ or installing node-fetch. Please upgrade Node.js or use a local file.');
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`Warning: Content-Type is "${contentType}", expected an image type`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Successfully downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    throw new Error(`Failed to download image from URL: ${error.message}`);
  }
}

// --- Configuration and Argument Parsing ---

const parser = yargs(hideBin(process.argv))
  .usage('Usage: $0 --image <path_or_url> --output <path> [--mcversion <mc_version_key>] [options]')
  .example('$0 -i ./my-image.png -o ./output.nbt', 'Convert local image file')
  .example('$0 -i "https://example.com/image.png" -o ./output.nbt', 'Convert image from URL')
  .option('image', {
    alias: 'i',
    description: 'Path to the input image file or URL to an image',
    type: 'string',
    demandOption: true,
  })
  .option('output', {
    alias: 'o',
    description: 'Path to save the output NBT file',
    type: 'string',
    demandOption: true,
  })
  .option('mcversion', {
    description: 'Target Minecraft version key (e.g., "1_20", "1_19")',
    type: 'string',
    default: '1_20',
    demandOption: false,
  })
  .option('staircasing', {
    description: 'Staircasing mode for 3D structure',
    type: 'string',
    default: 'VALLEY', // Default used in web UI for NBT
    choices: ['OFF', 'CLASSIC', 'VALLEY', 'FULL_DARK', 'FULL_LIGHT'] // Based on MapModes.json for SCHEMATIC_NBT
  })
   .option('dithering', {
    description: 'Dithering algorithm',
    type: 'string',
    default: 'FloydSteinberg',
    choices: ['None', 'FloydSteinberg', 'Bayer44', 'Bayer22', 'Ordered33', 'MinAvgErr', 'Burkes', 'SierraLite', 'Stucki', 'Atkinson'] // Based on DitherMethods.json keys
  })
  .option('supportBlock', {
    description: 'NBT name for the support block',
    type: 'string',
    default: 'cobblestone',
  })
   .option('supportMode', {
    description: 'Support block placement mode',
    type: 'string',
    default: 'ALL_OPTIMIZED',
    choices: ['NONE', 'ALL', 'ALL_OPTIMIZED', 'MANDATORY_ONLY'] // Based on WhereSupportBlocksModes.json keys
  })
   .option('betterColour', {
    description: 'Use LAB colour comparison (true) or RGB (false)',
    type: 'boolean',
    default: true,
  })
  .help()
  .alias('help', 'h');

const argv = parser.parse(); // Use parse() explicitly

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
const MapModes = loadJson('./src/components/mapart/json/mapModes.json');
const DitherMethods = loadJson('./src/components/mapart/json/ditherMethods.json');
const WhereSupportBlocksModes = loadJson('./src/components/mapart/json/whereSupportBlocksModes.json');

// --- Validate Inputs ---

// Find the internal key for the version (e.g., "1_20" for "1.20")
const versionKey = argv.mcversion; // Use the renamed argument
// Validate the provided key
if (!supportedVersions[versionKey]) {
  console.error(`Error: Unsupported Minecraft version key "${argv.mcversion}".`);
  console.error(`Supported version keys: ${Object.keys(supportedVersions).join(', ')}`);
  process.exit(1);
}
const optionValue_version = supportedVersions[versionKey];

// Validate and get IDs for modes
const selectedStaircasingMode = MapModes.SCHEMATIC_NBT.staircaseModes[argv.staircasing];
if (!selectedStaircasingMode) {
     console.error(`Error: Invalid staircasing mode "${argv.staircasing}" for NBT.`);
     process.exit(1);
}
const optionValue_staircasing = selectedStaircasingMode.uniqueId;

const selectedDitherMethod = DitherMethods[argv.dithering];
if (!selectedDitherMethod) {
    console.error(`Error: Invalid dithering mode "${argv.dithering}".`);
    process.exit(1);
}
const optionValue_dithering = selectedDitherMethod.uniqueId;

const selectedSupportMode = WhereSupportBlocksModes[argv.supportMode];
if (!selectedSupportMode) {
    console.error(`Error: Invalid support block mode "${argv.supportMode}".`);
    process.exit(1);
}
const optionValue_whereSupportBlocks = selectedSupportMode.uniqueId;

// --- Processing Helper Functions ---

// Recreate exact colour cache setup (needed for mapping processed pixels back to colourSetId/tone)
function setupExactColourCache(cJSON) {
  const cache = new Map();
  for (const [colourSetId, colourSet] of Object.entries(cJSON)) {
    for (const [toneKey, toneRGB] of Object.entries(colourSet.tonesRGB)) {
      const RGBBinary = (toneRGB[0] << 16) + (toneRGB[1] << 8) + toneRGB[2];
      cache.set(RGBBinary, {
        colourSetId: colourSetId,
        tone: toneKey,
      });
    }
  }
  return cache;
}

// --- Main Logic ---

async function run() {
  try {
    console.log(`Processing image: ${argv.image}`);
    console.log(`Target version: ${argv.mcversion}`);
    console.log(`Output file: ${argv.output}`);

    // 1. Prepare "Everything" Preset Block Selection
    console.log('Determining "Everything" block selection...');
    const selectedBlocks = {};
    for (const colourSetId in coloursJSON) {
        let defaultBlockId = "-1"; // Default to "none"
        let minPresetIndex = Infinity;

        for (const blockId in coloursJSON[colourSetId].blocks) {
            const blockData = coloursJSON[colourSetId].blocks[blockId];
            // Check if block is valid for the target version (directly or via reference)
             let currentVersionData = blockData.validVersions[optionValue_version.MCVersion];
             let isValid = !!currentVersionData; // Check initial existence

             // Basic reference check (might need deeper check if multi-level refs exist)
             if (typeof currentVersionData === 'string' && currentVersionData.startsWith('&')) {
                 isValid = !!blockData.validVersions[currentVersionData.slice(1)];
             }

            // Find block with presetIndex 0 (or the lowest if 0 isn't present) that's valid
            if (isValid && blockData.hasOwnProperty('presetIndex') && blockData.presetIndex < minPresetIndex) {
                minPresetIndex = blockData.presetIndex;
                defaultBlockId = blockId;
                 // Prefer index 0 if found
                if (minPresetIndex === 0) break;
            }
        }
         if (defaultBlockId === "-1" && minPresetIndex === Infinity) {
             // If no block with a presetIndex was found valid, try finding *any* valid block
             for (const blockId in coloursJSON[colourSetId].blocks) {
                 const blockData = coloursJSON[colourSetId].blocks[blockId];
                  let currentVersionData = blockData.validVersions[optionValue_version.MCVersion];
                  let isValid = !!currentVersionData;
                  if (typeof currentVersionData === 'string' && currentVersionData.startsWith('&')) {
                      isValid = !!blockData.validVersions[currentVersionData.slice(1)];
                  }
                  if (isValid) {
                      defaultBlockId = blockId;
                      break; // Take the first valid one
                  }
             }
         }
        selectedBlocks[colourSetId] = defaultBlockId;
         if (defaultBlockId === "-1") {
            // console.warn(`No valid default block found for colourSetId ${colourSetId} in version ${argv.version}`);
         }
    }
    // console.log("Selected Blocks:", selectedBlocks); // Optional: Log the determined selection

    // 2. Image Processing (Load, Resize, Get Raw Pixels)
    console.log('Resizing image to 16x16 (nearest neighbor)...');
    
    let imageInput;
    if (isValidUrl(argv.image)) {
      // Download image from URL
      const imageBuffer = await downloadImage(argv.image);
      imageInput = imageBuffer;
    } else {
      // Use local file path
      imageInput = argv.image;
    }
    
    console.log('Flattening transparent background...');
    const { data: rgbaBuffer, info } = await sharp(imageInput)
      .resize(16, 16, { kernel: sharp.kernel.nearest })
      .flatten({ background: { r: 153, g: 153, b: 153 } }) // Flatten transparency to grey
      .ensureAlpha() // Ensure 4 channels (RGBA)
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.width !== 16 || info.height !== 16) {
        throw new Error(`Sharp failed to resize image to 16x16. Result: ${info.width}x${info.height}`);
    }
    console.log('Image resized and raw RGBA data obtained.');

    // 3. Call Refactored processImageData
    console.log('Processing image data (colour matching, dithering)...');
    const processOptions = {
      coloursJSON,
      MapModes,
      DitherMethods,
      selectedBlocks,
      optionValue_modeNBTOrMapdat: MapModes.SCHEMATIC_NBT.uniqueId, // Force NBT mode
      optionValue_staircasing,
      optionValue_betterColour: argv.betterColour,
      optionValue_dithering,
      // Pass other options if needed by processImageData in future
    };
    const processResult = processImageData(rgbaBuffer, 16, 16, processOptions);

    if (!processResult) {
        throw new Error("Image processing failed.");
    }
    const { processedPixels, maps: processedMaps } = processResult;
    console.log('Image data processed.');

    // 4. Prepare coloursLayout for Map_NBT
    console.log('Building coloursLayout for NBT structure...');
    const exactColourCache = setupExactColourCache(coloursJSON);
    const coloursLayout = Array.from({ length: 16 }, () => []); // 16 columns

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const idx = (y * 16 + x) * 4;
            const r = processedPixels[idx];
            const g = processedPixels[idx + 1];
            const b = processedPixels[idx + 2];
            // Alpha is ignored for NBT mapping, assumed opaque from processImageData output
            const rgbBinary = (r << 16) + (g << 8) + b;
            const colourSetIdAndTone = exactColourCache.get(rgbBinary);

            if (!colourSetIdAndTone) {
                 // This shouldn't happen if processImageData worked correctly and cache is synchronised
                 console.warn(`Warning: Could not map RGB(${r},${g},${b}) back to colourSetId/tone at (${x},${y}). Using air.`);
                  // Using a placeholder or skipping might be better? Let's use air ('-1')
                  coloursLayout[x].push({ colourSetId: "-1", tone: "normal" });
            } else {
                 coloursLayout[x].push(colourSetIdAndTone); // Add { colourSetId, tone } to the current column
            }
        }
    }
     console.log('ColoursLayout built.');

    // 5. Call Refactored Map_NBT
    console.log('Generating NBT structure...');
    const mapInput = {
        coloursLayout: coloursLayout,
        materials: processedMaps[0][0].materials // Get materials from the single map entry
    };
    const nbtOptions = {
      coloursJSON,
      optionValue_version,
      optionValue_staircasing,
      optionValue_whereSupportBlocks,
      optionValue_supportBlock: argv.supportBlock,
      currentSelectedBlocks: selectedBlocks, // Pass the determined "Everything" selection
       // Pass required constants if not implicitly handled by IDs
       MapModes: MapModes,
       WhereSupportBlocksModes: WhereSupportBlocksModes
    };

    const mapNbtInstance = new Map_NBT(mapInput, nbtOptions);

    // 6. Generate and Compress NBT
    const nbtArrayBuffer = mapNbtInstance.getNBT(); // Returns ArrayBuffer
    const nbtBuffer = Buffer.from(nbtArrayBuffer); // Convert to Node Buffer
    console.log('NBT structure generated.');

    console.log('Compressing NBT data (gzip)...');
    const compressedNbt = zlib.gzipSync(nbtBuffer);

    // 7. Save Output
    const outputDir = path.dirname(argv.output);
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(argv.output, compressedNbt);
    console.log(`✅ Successfully generated NBT file: ${argv.output}`);

  } catch (error) {
    console.error('❌ Error during script execution:', error);
    process.exit(1);
  }
}

run(); 