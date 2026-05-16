'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '../lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative inline-flex size-10 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-bold',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/**
 * AvatarGroup — overlap orizzontale stile MUI con bordo ocra (DESIGN.md).
 * Allineato a destra di default.
 *
 *   <AvatarGroup max={4}>
 *     <Avatar><AvatarFallback>MR</AvatarFallback></Avatar>
 *     ...
 *   </AvatarGroup>
 */
function AvatarGroup({
  children,
  className,
  max = 5,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const items = React.Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = Math.max(0, items.length - max);

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex flex-row-reverse items-center">
        {[...visible].reverse().map((child, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full ring-2 ring-primary',
              i > 0 && '-mr-2.5', // overlap (in flex-row-reverse i > 0 = elementi sotto)
            )}
          >
            {child}
          </div>
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-2 font-mono text-xs font-bold text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarImage };
