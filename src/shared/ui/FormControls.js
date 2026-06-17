import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

// ── Shared styles ─────────────────────────────────────────────────────────
const inputBaseClass =
  'w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 disabled:cursor-not-allowed disabled:opacity-50';

// ── Components ────────────────────────────────────────────────────────────

export const Label = ({ children, required, className, ...props }) => (
  <label
    className={cn('text-xs font-bold uppercase tracking-wide text-slate-400', className)}
    {...props}
  >
    {children}
    {required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

Label.propTypes = {
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return <input type={type} className={cn(inputBaseClass, className)} ref={ref} {...props} />;
});

Input.displayName = 'Input';
Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
};

export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select className={cn(inputBaseClass, 'appearance-none', className)} ref={ref} {...props}>
      {children}
    </select>
  );
});

Select.displayName = 'Select';
Select.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea className={cn(inputBaseClass, 'min-h-[80px] resize-y', className)} ref={ref} {...props} />
  );
});

Textarea.displayName = 'Textarea';
Textarea.propTypes = {
  className: PropTypes.string,
};

export const FormField = ({ label, required, hint, children, className }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && <Label required={required}>{label}</Label>}
    {children}
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

FormField.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool,
  hint: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
