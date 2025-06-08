// src/lib/utils.ts
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | false | null)[]): string {
  return twMerge(clsx(...inputs))
}
