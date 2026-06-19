import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'bg-danger text-white font-semibold px-6 py-3 rounded-md hover:bg-red-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50',
  };

  const sizeClasses = {
    sm: 'text-sm px-4 py-2',
    md: '',
    lg: 'text-lg px-8 py-4',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
