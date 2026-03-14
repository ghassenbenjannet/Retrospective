import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ children, className, padding = true, ...props }: Props) {
  return (
    <div
      {...props}
      className={clsx('bg-white rounded-xl shadow-sm border border-gray-200', padding && 'p-6', className)}
    >
      {children}
    </div>
  );
}
