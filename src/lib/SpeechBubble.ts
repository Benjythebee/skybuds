import { Object3D, Sprite, SpriteMaterial, Texture, Vector3 } from "three";

interface BubbleOptions {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  padding?: number;
  borderRadius?: number;
  scale?: number;
  offset?: Vector3;
}

export class SpeechBubble {
  private sprite: Sprite;
  private textCanvas: HTMLCanvasElement;
  private textContext: CanvasRenderingContext2D;
  private texture: Texture;
  private material: SpriteMaterial;
  private scale: number;
  private offset: Vector3;
  private text: string;
  private options: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    padding: number;
    fontWeight: string;
    borderRadius: number;
  };

  constructor(text: string = "", scale: number = 1, offset: Vector3 = new Vector3(0.5, 0.5, 0)) {
    // Create a canvas for the text
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 256;
    this.textCanvas.height = 100;
    this.textContext = this.textCanvas.getContext('2d')!;
    this.scale = scale;
    this.offset = offset;
    this.text = text;
    
    // Default styling options
    this.options = {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      textColor: 'black',
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: '900',
      padding: 2,
      borderRadius: 10
    };

    // Create texture from canvas
    this.texture = new Texture(this.textCanvas);
    
    // Create the sprite material
    this.material = new SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
    
    // Create the sprite
    this.sprite = new Sprite(this.material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    
    // Set the text
    this.drawBubble();
  }
  
  public setText(text: string): void {
    this.text = text;
    this.drawBubble();
  }
  
  /**
   * Updates the speech bubble with new options and redraws it
   * @param options Options to update the bubble appearance
   */
  public updateBubble(options?: BubbleOptions): void {
    // Update any provided options
    if (options) {
      if (options.backgroundColor) this.options.backgroundColor = options.backgroundColor;
      if (options.textColor) this.options.textColor = options.textColor;
      if (options.fontSize) this.options.fontSize = options.fontSize;
      if (options.fontWeight) this.options.fontWeight = options.fontWeight;
      if (options.fontFamily) this.options.fontFamily = options.fontFamily;
      if (options.padding) this.options.padding = options.padding;
      if (options.borderRadius) this.options.borderRadius = options.borderRadius;
      if (options.scale) {
        this.scale = options.scale;
        this.sprite.scale.set(this.scale * 2, this.scale, 1);
      }
      if (options.offset) this.offset = options.offset;
    }
    
    // Redraw the bubble with updated options
    this.drawBubble();
  }
  
  private drawBubble(): void {
    // Clear the canvas
    this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
    
    // Draw speech bubble background
    this.textContext.fillStyle = this.options.backgroundColor;
    this.drawRoundedRect(
      this.options.padding,
      this.options.padding,
      this.textCanvas.width - (this.options.padding * 2),
      // Leave some space for the pointer
      this.textCanvas.height - (this.options.padding * 2) - 20, 
      this.options.borderRadius
    );
    
    this.textContext.beginPath();
    // Calculate a position that's about 1/4 of the way to the right
    const pointerX = this.textCanvas.width * 0.25;
    this.textContext.moveTo(pointerX - 10, this.textCanvas.height - 25);
    this.textContext.lineTo(pointerX, this.textCanvas.height - 10);
    this.textContext.lineTo(pointerX + 10, this.textCanvas.height - 25);
    this.textContext.fill();
    
    // Draw text
    this.textContext.fillStyle = this.options.textColor;
    this.textContext.font = `${this.options.fontWeight} ${this.options.fontSize}px ${this.options.fontFamily}`;
    this.textContext.textAlign = 'center';
    this.textContext.textBaseline = 'middle';
    // Handle multi-line text
    const lines = this.wrapText(this.text, this.textCanvas.width - (this.options.padding * 4));
    const lineHeight = this.options.fontSize + 4;
    const startY = (this.textCanvas.height - (this.options.padding * 2) - 20) / 2 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      this.textContext.fillText(
        line, 
        this.textCanvas.width / 2, 
        startY + index * lineHeight
      );
    });
    
    // Update the texture
    this.texture.needsUpdate = true;
  }
  
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    // Set the font for text measurement
    this.textContext.font = `${this.options.fontWeight} ${this.options.fontSize}px ${this.options.fontFamily}`;

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.textContext.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }
  
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.textContext.beginPath();
    this.textContext.moveTo(x + radius, y);
    this.textContext.lineTo(x + width - radius, y);
    this.textContext.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.textContext.lineTo(x + width, y + height - radius);
    this.textContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.textContext.lineTo(x + radius, y + height);
    this.textContext.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.textContext.lineTo(x, y + radius);
    this.textContext.quadraticCurveTo(x, y, x + radius, y);
    this.textContext.closePath();
    this.textContext.fill();
  }
  
  public followObject(object: Object3D): void {
    // Position the speech bubble above the object
    this.sprite.position.copy(object.position).add(this.offset);
  }
  
  public getSprite(): Sprite {
    return this.sprite;
  }
  
  public dispose(): void {
    this.material.dispose();
    this.texture.dispose();
  }
}