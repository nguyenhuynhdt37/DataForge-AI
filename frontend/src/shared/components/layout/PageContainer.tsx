import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'default' | 'full' | 'narrow';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'default',
  className = '',
}) => {
  const widthClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-[1340px]',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className={`mx-auto w-full px-4 sm:px-6 md:px-8 py-8 ${widthClasses} ${className}`}>
      {children}
    </div>
  );
};
