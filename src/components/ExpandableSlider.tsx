import React, { useState } from 'react';
import { Slider } from './Slider';
import { cn } from 'lib/ui-helpers/cn';

interface ExpandableSliderButtonProps {
  onSliderChange?: (value: number) => void;
  initialValue?: number;
  className?: string;
}

const ExpandableSliderButton: React.FC<ExpandableSliderButtonProps> = ({
  onSliderChange,
  initialValue = 0.5,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("flex items-center",className)}>
      <button
        onClick={handleButtonClick}
        className="bg-black/50 hover:bg-black/60 text-white font-medium py-1 px-1 rounded focus:outline-none "
      >
        Set
      </button>
      
      <div 
        className={`overflow-hidden transition-all py-2 h-6 bg-black/40 rounded-md duration-300 ease-in-out flex items-center ml-2 ${
          isExpanded ? 'w-48 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="w-full">
          <Slider 
            initialValue={initialValue} 
            onChange={onSliderChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpandableSliderButton;