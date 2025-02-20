import React from 'react';

const TabsContext = React.createContext({ value: '', onValueChange: (value: string) => {} });

export const Tabs = ({ value, onValueChange, children, ...props }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className="w-full" {...props}>
      {children}
    </div>
  </TabsContext.Provider>
);

export const TabsList = ({ className = '', children, ...props }) => (
  <div className={`inline-flex w-full items-center justify-center rounded-lg bg-gray-100 p-1 ${className}`} {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, className = '', children, ...props }) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = value === selectedValue;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${isSelected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'} ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className = '', children, ...props }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  if (value !== selectedValue) return null;

  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`} {...props}>
      {children}
    </div>
  );
};