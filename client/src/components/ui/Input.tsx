import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      {...props}
      className={clsx(
        'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

Input.displayName = 'Input';
