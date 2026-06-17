import React from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { FaSpinner } from 'react-icons/fa';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rv-touch-target',
  {
    variants: {
      variant: {
        primary: 'bg-rv-gold text-rv-dark hover:brightness-105 shadow-rv-gold',
        secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
        danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-500',
        ghost: 'bg-transparent text-white hover:bg-white/10',
        outline: 'border border-rv-gold/55 bg-transparent text-rv-gold hover:bg-rv-gold/15',
        link: 'bg-transparent text-rv-gold underline-offset-4 hover:underline'
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'h-12 w-12 p-0'
      },
      state: {
        default: '',
        active: 'scale-[0.99] ring-2 ring-rv-gold/70 ring-offset-0',
        subtle: 'opacity-90 hover:opacity-100'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      state: 'default'
    }
  }
);

const Button = ({ className, variant, size, state, type = 'button', isLoading = false, loadingText, children, disabled, ...props }) => {
  return (
    <button 
      type={type} 
      className={cn(buttonVariants({ variant, size, state }), className)} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <FaSpinner className="mr-2 animate-spin" aria-hidden="true" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'outline', 'link']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon']),
  state: PropTypes.oneOf(['default', 'active', 'subtle']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  disabled: PropTypes.bool,
  children: PropTypes.node
};

export default Button;
