# MapartCraft CLI

This tool generates 16x16 Minecraft map art NBT schematics from image files via the command line. It uses the core logic from the MapartCraft web application.

## Requirements

*   [Node.js](https://nodejs.org/) v14.x is required for this project.

## Installation

1.  Clone or download the repository.
2.  Navigate to the project root directory (`mapartcraft`) in your terminal.
3.  Install the necessary dependencies:
    ```bash
    npm install
    ```
    This will install libraries like `sharp` (for image processing) and `yargs` (for argument parsing). Note: You might see warnings during installation if your Node.js version is older, but the script may still work.

## Usage

The primary script is `mapart-cli.js` located in the project root.

1.  Make the script executable (only needs to be done once):
    ```bash
    chmod +x mapart-cli.js
    ```
2.  Run the script:
    ```bash
    ./mapart-cli.js --image <path_to_input_image> --output <path_for_output.nbt> [options]
    ```

### Arguments

*   `--image` (`-i`): **Required.** Path to the input image file (e.g., `my_picture.png`).
*   `--output` (`-o`): **Required.** Path where the output NBT schematic file should be saved (e.g., `output/my_map.nbt`).
*   `--mcversion`: Target Minecraft version key. Determines available blocks. (Default: `1_20`, Optional). Examples: `1_19`, `1_18_2`, `1_16_5`, etc. See `src/components/mapart/json/supportedVersions.json` for all keys.
*   `--staircasing`: Staircasing mode for 3D structure. (Default: `VALLEY`). Choices: `OFF`, `CLASSIC`, `VALLEY`, `FULL_DARK`, `FULL_LIGHT`.
*   `--dithering`: Dithering algorithm. (Default: `FloydSteinberg`). Choices: `None`, `FloydSteinberg`, `Bayer44`, `Bayer22`, `Ordered33`, `MinAvgErr`, `Burkes`, `SierraLite`, `Stucki`, `Atkinson`.
*   `--supportBlock`: NBT name for the support block used. (Default: `cobblestone`). Example: `minecraft:stone`, `netherrack`.
*   `--supportMode`: How support blocks are placed. (Default: `ALL_OPTIMIZED`). Choices: `NONE`, `ALL`, `ALL_OPTIMIZED`, `MANDATORY_ONLY`.
*   `--betterColour`: Use more accurate LAB colour comparison (`true`) or faster RGB (`false`). (Default: `true`).
*   `--help` (`-h`): Show help message listing all options.

### Example

To generate a map art schematic for Minecraft 1.20 (the default) from `input.jpg` and save it as `mymap.nbt` in the `output` directory:

```bash
./mapart-cli.js --image input.jpg --output output/mymap.nbt
```

To generate for Minecraft 1.16.5 using classic staircasing and no dithering:

```bash
./mapart-cli.js --image logo.png --output maps/logo_1.16.nbt --mcversion 1_16_5 --staircasing CLASSIC --dithering None
```

## Credits

Based on the MapartCraft web application by rebane2001 and contributors. Uses textures from Minecraft.
