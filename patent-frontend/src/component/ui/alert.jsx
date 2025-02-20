import React from 'react';

export const Alert = ({ variant = 'default', className = '', children, ...props }) => (
  <div
    role="alert"
    className={`rounded-lg border p-4 ${variant === 'destructive' ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200 bg-white'} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const AlertTitle = ({ className = '', children, ...props }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h5>
);

export const AlertDescription = ({ className = '', children, ...props }) => (
  <div className={`text-sm opacity-90 ${className}`} {...props}>
    {children}
  </div>
);
