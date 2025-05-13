import React, { useState, useEffect } from 'react';

interface SliderProps {
  initialValue?: number;
  onChange?: (value: number) => void;
  step?: number;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({
  initialValue = 0.5,
  onChange,
  step = 0.01,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);

  // Ensure initial value is between 0 and 1
  useEffect(() => {
    setValue(Math.min(Math.max(initialValue, 0), 1));
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Implement proper dragging functionality
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove event listeners when drag ends
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateValueFromClientX(e.clientX);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    updateValueFromClientX(e.touches[0].clientX);
  };
  
  const updateValueFromClientX = (clientX: number) => {
    // Find the track element and calculate relative position
    const trackElement = document.querySelector('.slider-track') as HTMLElement;
    if (!trackElement) return;
    
    const rect = trackElement.getBoundingClientRect();
    const trackWidth = rect.width;
    const offsetX = clientX - rect.left;
    
    // Calculate the new value based on position
    const newValue = parseFloat((Math.max(0.01, Math.min(1, offsetX / trackWidth))).toFixed(2));
    
    // Update the value
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get the track element's position and width
    const trackElement = e.currentTarget;
    const rect = trackElement.getBoundingClientRect();
    
    // Calculate the new value based on click position
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    const newValue = parseFloat((Math.max(0.01, Math.min(1, clickX / trackWidth))).toFixed(2));
    
    // Update the value
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div 
        className="relative h-2 w-full cursor-pointer slider-track"
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div className="absolute inset-0 w-full h-full bg-gray-200 rounded-lg"></div>
        
        {/* Track fill */}
        <div 
          className="absolute top-0 left-0 h-full bg-black rounded-l-lg"
          style={{ width: `${value * 100}%` }}
        />
        
        {/* Hidden original input for accessibility */}
        <input
          type="range"
          min="0.01"
          max="1"
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom slider thumb - positioned exactly at the end of the black bar */}
        <div 
          className={`absolute h-4 w-4 rounded-full bg-black border-2 border-white ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{
            left: `${value * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'transform 0.1s, scale 0.1s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
};