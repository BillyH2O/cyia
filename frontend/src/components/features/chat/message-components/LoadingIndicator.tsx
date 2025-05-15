import React from 'react';
import BotAvatar from './BotAvatar';

export interface LoadingIndicatorProps {
  cyTechLogo?: string | null;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ cyTechLogo }) => (
  <div className="flex justify-start items-center gap-3">
    <BotAvatar cyTechLogo={cyTechLogo} />
    <div className="rounded-lg p-3 bg-card text-card-foreground border shadow-sm">
      <div className="flex space-x-1 animate-pulse">
        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-200"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-400"></div>
      </div>
    </div>
  </div>
);

export default LoadingIndicator; 