import React from 'react';

interface ParentConnectIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ParentConnectIcon: React.FC<ParentConnectIconProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center ${className}`}
    >
      <i className={`fas fa-users text-white ${iconSizes[size]}`}></i>
    </div>
  );
};

export default ParentConnectIcon;
