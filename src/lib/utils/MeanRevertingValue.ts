/**
 * A class that generates a random number between -0.5 and 0.5
 * and gradually reverts to the mean (0) over time.
 */
export class MeanRevertingValue {
    private currentValue: number = 0;
    private readonly min: number = -0.5;
    private readonly max: number = 0.5;
    private readonly mean: number = 0;
    private readonly revertSpeed: number;
  
    /**
     * @param revertSpeed - How quickly the value reverts to the mean (0-1)
     *                      Higher values = faster reversion
     */
    constructor(revertSpeed: number = 0.05) {
      // Clamp revert speed between 0 and 1
      this.revertSpeed = Math.max(0, Math.min(1, revertSpeed));
      
      // Initialize with a random value
      this.randomize();
    }
  
    /**
     * Generate a new random value between min and max
     */
    randomize(): number {
      this.currentValue = this.min + Math.random() * (this.max - this.min);
      return this.currentValue;
    }
  
    /**
     * Update the current value to revert toward the mean
     * @param deltaTime - Time elapsed since last update (for frame-rate independent movement)
     * @returns The updated current value
     */
    update(deltaTime: number = 1): number {
      // Calculate how much to move toward the mean
      const step = (this.mean - this.currentValue) * this.revertSpeed * deltaTime;
      
      // Apply the step
      this.currentValue += step;
      
      return this.currentValue;
    }
  
    /**
     * Get the current value without updating
     */
    getValue(): number {
      return this.currentValue;
    }
  }