import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:bg-gray-900 dark:border-gray-800 dark:shadow-[0_4px_12px_rgba(255,255,255,0.1)] overflow-visible text-white',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mb-2 flex flex-col space-y-1.5 overflow-visible break-words whitespace-normal text-white',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight break-words whitespace-normal text-white',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'pt-2 overflow-visible break-words whitespace-normal text-white',
      className
    )}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-gray-300 dark:text-gray-400 break-words whitespace-normal',
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'pt-2 flex items-center overflow-visible break-words whitespace-normal text-white',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
