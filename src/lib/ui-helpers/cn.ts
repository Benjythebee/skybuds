import { type CX, cx } from "cva";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to merge tailwind classes
 * @example
 * cn('text-center bg-pink bg-green') // 'text-center bg-green'
 */
export const cn = (...inputs: Parameters<CX>) => {
  return twMerge(cx(inputs));
};
