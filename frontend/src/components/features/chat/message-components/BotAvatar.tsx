import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface BotAvatarProps {
  cyTechLogo?: string | null;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({ cyTechLogo }) => (
  <Avatar className="w-8 h-8 border flex-shrink-0">
    {cyTechLogo ? (
      <img src={cyTechLogo} alt="CY Tech Logo" width={32} height={32} className="object-contain" />
    ) : (
      <AvatarFallback>CY</AvatarFallback>
    )}
  </Avatar>
);

export default BotAvatar; 