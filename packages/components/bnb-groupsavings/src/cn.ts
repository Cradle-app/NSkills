import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind + clsx class names.
 * Shared utility so the component package doesn't depend on the
 * app's own `cn` helper.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
