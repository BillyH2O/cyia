import React from 'react';
import Image from 'next/image';

export interface ModelInfoProps {
  model: string;
  processingTime?: number;
  getModelLogo: (modelId: string) => string | null;
  getModelName: (modelId: string) => string;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({ 
  model, 
  processingTime, 
  getModelLogo, 
  getModelName 
}) => {
  const logo = getModelLogo(model);
  
  return (
    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {logo && (
          <div className="w-4 h-4 relative flex-shrink-0">
            <Image 
              src={logo} 
              alt={`Logo ${getModelName(model)}`}
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
        )}
        <span>Modèle: {getModelName(model)}</span>
      </div>
      {processingTime && (
        <span className="inline-flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-3 h-3 mr-1 relative -mt-[0.5px]" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {processingTime.toFixed(2)}s
        </span>
      )}
    </div>
  );
};

export default ModelInfo; 