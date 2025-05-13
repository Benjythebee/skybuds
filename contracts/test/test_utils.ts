/**
 * Encodes metadata into a single BigInt
 * @param wearableIds - Array of wearable IDs (0-1000)
 * @param isTalkative - Boolean flag (true/false)
 * @param speed - Value from 0-100 representing 0.00-1.00
 * @param laziness - Value from 0-100 representing 0.00-1.00
 * @param color - Hex color string (e.g., "#FF5500")
 * @returns Encoded metadata as a BigInt
 */
export function encodeMetadata(
  wearableIds: number[],
  isTalkative: boolean,
  speed: number,
  laziness: number,
  color: string
): bigint {
  // Constants
  const MAX_WEARABLE_ID = 1000;
  const MAX_WEARABLES = 10;
  const BITS_PER_WEARABLE = 10; // 2^10 = 1024 > 1000
  
  // For 2 decimal places (0.00 to 1.00), we need 7 bits (2^7 = 128 > 101 values)
  const BITS_PER_DECIMAL = 7;
  
  // For color, we need 24 bits (RGB: 8 bits each)
  const BITS_PER_COLOR = 24;
  
  // Positions in the uint256
  const POSITION_WEARABLES = 0;
  const POSITION_TALKATIVE = BITS_PER_WEARABLE * MAX_WEARABLES;
  const POSITION_SPEED = POSITION_TALKATIVE + 1;
  const POSITION_LAZINESS = POSITION_SPEED + BITS_PER_DECIMAL;
  const POSITION_COLOR = POSITION_LAZINESS + BITS_PER_DECIMAL;
  
  // Mask for color (24 bits)
  const MASK_COLOR = (1 << BITS_PER_COLOR) - 1;
  
  // Validation
  if (wearableIds.length > MAX_WEARABLES) {
    throw new Error("Too many wearables");
  }
  
  // Validate all wearable IDs are within range
  for (let i = 0; i < wearableIds.length; i++) {
    if (wearableIds[i] > MAX_WEARABLE_ID) {
      throw new Error("Wearable ID out of range");
    }
  }
  
  // Validate speed and laziness are within range (0 to 1 with 2 decimal precision)
  if (speed > 100) { // 100 = 1.00
    throw new Error("Speed out of range");
  }
  if (laziness > 100) { // 100 = 1.00
    throw new Error("Laziness out of range");
  }
  
  // Convert color from hex string to number
  const colorValue = hexStringToNumber(color);
  
  // Validate color is within range
  if (colorValue > MASK_COLOR) {
    throw new Error("Color value out of range");
  }
  
  // Start with zero
  let metadata = BigInt(0);
  
  // Encode wearable IDs
  for (let i = 0; i < wearableIds.length; i++) {
    metadata |= BigInt(wearableIds[i]) << BigInt(POSITION_WEARABLES + i * BITS_PER_WEARABLE);
  }
  
  // Encode isTalkative
  if (isTalkative) {
    metadata |= BigInt(1) << BigInt(POSITION_TALKATIVE);
  }
  
  // Encode speed (0 to 100 representing 0.00 to 1.00)
  metadata |= BigInt(speed) << BigInt(POSITION_SPEED);
  
  // Encode laziness (0 to 100 representing 0.00 to 1.00)
  metadata |= BigInt(laziness) << BigInt(POSITION_LAZINESS);
  
  // Encode color (24-bit RGB value)
  metadata |= BigInt(colorValue) << BigInt(POSITION_COLOR);
  
  return metadata;
}

/**
 * Decodes metadata from a single BigInt
 * @param metadata - The encoded metadata as a BigInt
 * @returns Decoded metadata components
 */
export function decodeMetadata(metadata: bigint): {
  wearableIds: number[];
  isTalkative: boolean;
  speed: number;
  laziness: number;
  color: string;
} {
  // Constants
  const MAX_WEARABLES = 10;
  const BITS_PER_WEARABLE = 10;
  const BITS_PER_DECIMAL = 7;
  const BITS_PER_COLOR = 24;
  
  // Positions in the uint256
  const POSITION_WEARABLES = 0;
  const POSITION_TALKATIVE = BITS_PER_WEARABLE * MAX_WEARABLES;
  const POSITION_SPEED = POSITION_TALKATIVE + 1;
  const POSITION_LAZINESS = POSITION_SPEED + BITS_PER_DECIMAL;
  const POSITION_COLOR = POSITION_LAZINESS + BITS_PER_DECIMAL;
  
  // Masks for extracting values
  const MASK_WEARABLE = BigInt((1 << BITS_PER_WEARABLE) - 1);
  const MASK_TALKATIVE = BigInt(1);
  const MASK_DECIMAL = BigInt((1 << BITS_PER_DECIMAL) - 1);
  const MASK_COLOR = BigInt((1 << BITS_PER_COLOR) - 1);
  
  // Decode wearable IDs
  const wearableIds: number[] = [];
  for (let i = 0; i < MAX_WEARABLES; i++) {
    const wearableId = Number(
      (metadata >> BigInt(POSITION_WEARABLES + i * BITS_PER_WEARABLE)) & MASK_WEARABLE
    );
    wearableIds.push(wearableId);
  }
  
  // Decode isTalkative
  const isTalkative = ((metadata >> BigInt(POSITION_TALKATIVE)) & MASK_TALKATIVE) === BigInt(1);
  
  // Decode speed
  const speed = Number((metadata >> BigInt(POSITION_SPEED)) & MASK_DECIMAL);
  
  // Decode laziness
  const laziness = Number((metadata >> BigInt(POSITION_LAZINESS)) & MASK_DECIMAL);
  
  // Decode color
  const colorValue = Number((metadata >> BigInt(POSITION_COLOR)) & MASK_COLOR);
  const color = numberToHexString(colorValue);
  
  return {
    wearableIds,
    isTalkative,
    speed,
    laziness,
    color
  };
}

/**
 * Converts a hex string (e.g., "#FF5500") to a number
 * @param hexString - Color as a hex string
 * @returns Color as a number
 */
function hexStringToNumber(hexString: string): number {
  // Remove '0x' or '#' prefix if present
  let cleanHex = hexString.replace(/^(0x|#)/, '');
  
  // Ensure 6 characters for RGB (add leading zeros if needed)
  while (cleanHex.length < 6) {
    cleanHex = '0' + cleanHex;
  }
  
  // Take only first 6 characters if longer
  cleanHex = cleanHex.substring(0, 6);
  
  // Parse as hex number
  return parseInt(cleanHex, 16);
}

/**
 * Converts a number to a hex color string
 * @param value - Color as a number
 * @returns Color as a hex string (e.g., "#FF5500")
 */
function numberToHexString(value: number): string {
  // Convert to 6-digit hex and add # prefix
  return '#' + value.toString(16).padStart(6, '0').toUpperCase();
}

