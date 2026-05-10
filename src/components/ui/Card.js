import React from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const cardVariants = cva(
  'rounded-2xl border backdrop-blur-md transition-all duration-200',
  {
    variants: {
      variant: {
        glass: 'border-white/15 bg-slate-900/55 shadow-[0_12px_34px_rgba(0,0,0,0.35)]',
        solid: 'border-slate-200 bg-white text-slate-900 shadow-md',
        soft: 'border-rv-gold/25 bg-black/35 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-5 mobile:p-6',
        lg: 'p-6 mobile:p-8'
      }
    },
    defaultVariants: {
      variant: 'glass',
      padding: 'md'
    }
  }
);

const Card = ({ className, variant, padding, children, ...props }) => {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['glass', 'solid', 'soft']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  children: PropTypes.node
};

export default Card;
