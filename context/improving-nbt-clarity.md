# Improving NBT File Clarity and Appearance

This document outlines strategies for controlling the visual output of generated NBT files to improve their clarity, focusing on color schemes and background color.

## Controlling Color Schemes

A common desire is to limit the block palette to a specific "color scheme" (e.g., only wool blocks, only concrete blocks) to create a more consistent aesthetic.

### Current Behavior: The "Everything" Preset

Currently, the `mapart-cli.js` tool does **not** have a command-line option to select a specific color scheme. Instead, it uses a hardcoded block selection strategy known as the "Everything" preset.

Here's how it works:
1. For every possible map color, the tool scans all the blocks that can produce that color, as defined in `coloursJSON.json`.
2. It checks which of those blocks are compatible with the target Minecraft version (`--mcversion`).
3. Among the valid blocks, it selects the one with the lowest `presetIndex` value. `presetIndex: 0` is considered the highest priority.

This automatic approach is designed for maximum color accuracy by using the widest possible palette, but it does not allow for artistic constraints.

### Path Forward: Implementing Custom Color Schemes

To enable custom color schemes, a new feature would need to be added to the CLI tool. Here is a proposed implementation plan:

1.  **Introduce a New CLI Argument**: A new argument, such as `--allow-blocks` or `--palette`, could be added.
2.  **Define Argument Behavior**: This argument could accept a comma-separated list of block `displayName`s, `NBTName`s, or even predefined preset names (e.g., `wool`, `terracotta`, `concrete`).
3.  **Modify Block Selection Logic**: The block selection logic in `mapart-cli.js` would need to be updated to:
    *   Parse the new argument.
    *   Filter the blocks from `coloursJSON.json` to only include those specified by the user.
    *   Proceed with the color matching process using only the user-defined palette.

This enhancement would provide full control over the artistic direction of the generated map art.

## Setting a White Background

Making the "background" of the NBT structure white is straightforward and can be achieved with the existing tool.

In the context of a MapartCraft NBT schematic, the "background" is the layer of support blocks placed underneath the art. By default, this is cobblestone.

### How to Change the Background

You can set this to any block you want, including a white one, by using the `--supportBlock` command-line argument.

**Example:**

To generate a schematic with a white wool background, run the following command:

```bash
./mapart-cli.js \\
  --image ./path/to/your/image.png \\
  --output ./path/to/your/schematic.nbt \\
  --supportBlock white_wool
```

### How It Works
*   The `--supportBlock` argument overrides the default `cobblestone` value.
*   The tool will place `minecraft:white_wool` as the support structure.
*   If your source image has transparent areas, these will become empty space (air) in the schematic, making the white wool layer below visible. This effectively creates a solid white background.

### Other White Blocks

You can use any valid block NBT name. Other good options for a white background include:
*   `white_concrete`
*   `calcite`
*   `diorite`
*   `bone_block`
*   `snow_block` 