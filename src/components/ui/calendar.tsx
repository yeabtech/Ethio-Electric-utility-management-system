// components/ui/calendar.tsx
import * as React from 'react'
import { DayPicker, type DayPickerSingleProps } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export interface CalendarProps extends Omit<DayPickerSingleProps, 'disabled'> {
  /** Optional wrapper class */
  className?: string
  /** Disable specific dates */
  disabled?: (date: Date) => boolean
}

export function Calendar({ className, disabled, ...props }: CalendarProps) {
  return (
    <div className={className}>
      <DayPicker
        mode="single"
        selected={props.selected}
        onSelect={props.onSelect}
        disabled={disabled}
      />
    </div>
  )
}
