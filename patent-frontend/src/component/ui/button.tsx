import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-gray-900 text-white shadow hover:bg-gray-800',
    destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
    outline: 'border border-gray-200 bg-white shadow-sm hover:bg-gray-100',
    secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    link: 'text-gray-900 underline-offset-4 hover:underline'
  }

  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button, type ButtonProps }