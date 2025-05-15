'use client';

import React, { ChangeEvent } from 'react';

interface ChatOptionsProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  isLoading: boolean;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({
  temperature,
  onTemperatureChange,
  isLoading,
}) => {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Slider pour la température */}
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center justify-between">
          <label htmlFor="temperature" className="text-md text-muted-foreground">
            Temperature: <span className="font-medium">{temperature.toFixed(1)}</span>
          </label>
          <span className="text-xs text-muted-foreground">
            {temperature === 0 ? "Deterministic" : temperature < 0.7 ? "Focused" : temperature < 1.3 ? "Balanced" : "Creative"}
          </span>
        </div>
        <input
          type="range"
          id="temperature"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          disabled={isLoading}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
        <div className="flex justify-between w-full text-xs text-muted-foreground">
          <span>0</span>
          <span>1</span>
          <span>2</span>
        </div>
      </div>
    </div>
  );
};

export default ChatOptions; 