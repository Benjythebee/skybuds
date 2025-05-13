
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
 * Converts a number to a hex color string
 * @param value - Color as a number
 * @returns Color as a hex string (e.g., "#FF5500")
 */
function numberToHexString(value: number): string {
  // Convert to 6-digit hex and add # prefix
  return '#' + value.toString(16).padStart(6, '0').toUpperCase();
}


export type SkyBudAttributes = {
  trait_type: "Talkative"
  value: boolean
}|{
  trait_type: "Speed"
  value: number
}|{
  trait_type: "Laziness"
  value: number
}|{
  trait_type: "Color",
  value: string
}

export type SkyBudMetadata = {
  name: string
  description: string
  image: string
  attributes: SkyBudAttributes[]
  external_url: string
  tokenId: string
}

export const getAttribute = <T extends any>(data:SkyBudMetadata,name: SkyBudAttributes['trait_type']) => {
  const attribute = data.attributes.find(
    (attribute) => attribute.trait_type === name
  )
  return (attribute ? attribute.value : null ) as T | null
}