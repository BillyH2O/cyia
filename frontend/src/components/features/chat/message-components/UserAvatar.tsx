import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserAvatarProps {
  userImage?: string | null;
  userName?: string | null;
}

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name: string | null | undefined): string => {
  if (!name) return "U";
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ userImage, userName }) => (
  <Avatar className="w-8 h-8 border flex-shrink-0">
    <AvatarImage src={userImage || undefined} alt={userName || "Utilisateur"} />
    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
  </Avatar>
);

export default UserAvatar; 