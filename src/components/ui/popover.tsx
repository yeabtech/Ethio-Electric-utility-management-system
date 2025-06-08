// components/ui/popover.tsx
import * as React from 'react'
import * as RadixPopover from '@radix-ui/react-popover'

interface PopoverProps {
  children: React.ReactNode
}

export const Popover = RadixPopover.Root

export const PopoverTrigger = RadixPopover.Trigger

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      className={`z-50 w-64 rounded-md border bg-white p-4 shadow-md outline-none ${className}`}
      {...props}
    />
  </RadixPopover.Portal>
))
PopoverContent.displayName = 'PopoverContent'
