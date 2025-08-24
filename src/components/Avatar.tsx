import React from 'react';
import { getInitials } from '../lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }
        }}
      />
    );
  }

  return (
    <div className={`${sizeClass} bg-primary-500 rounded-full flex items-center justify-center text-white font-medium ${className}`}>
      {getInitials(alt)}
    </div>
  );
}

// Avatar with fallback component
export function AvatarWithFallback({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
      )}
      <div 
        className={`avatar-fallback w-full h-full bg-primary-500 rounded-full flex items-center justify-center text-white font-medium ${src ? 'hidden' : 'flex'}`}
      >
        {getInitials(alt)}
      </div>
    </div>
  );
}
