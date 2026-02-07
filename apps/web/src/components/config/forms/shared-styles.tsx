'use client';

/**
 * Shared Form Styles for Config Panel
 * 
 * This module provides consistent styling tokens for all node configuration forms.
 * Uses the new design system's CSS custom properties for full theme consistency.
 */

import { cn } from '@/lib/utils';

/**
 * Form section wrapper styles
 */
export const formStyles = {
  /** Root container for form content */
  container: 'space-y-5',

  /** Section wrapper with consistent spacing */
  section: 'space-y-3',

  /** Divider between sections */
  divider: 'h-px bg-[hsl(var(--color-border-subtle))] my-4',
};

/**
 * Form header/title block styles
 */
export const headerStyles = {
  /** Main header container */
  wrapper: cn(
    'flex items-start gap-3 p-3.5 rounded-xl',
    'bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.08)] via-[hsl(var(--color-bg-muted)/0.5)] to-transparent',
    'border border-[hsl(var(--color-accent-primary)/0.15)]'
  ),

  /** Icon container inside header */
  iconContainer: cn(
    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
    'bg-[hsl(var(--color-accent-primary)/0.12)]',
    'border border-[hsl(var(--color-accent-primary)/0.2)]'
  ),

  /** Header icon */
  icon: 'w-4.5 h-4.5 text-[hsl(var(--color-accent-primary))]',

  /** Header title text */
  title: 'text-sm font-semibold text-[hsl(var(--color-text-primary))]',

  /** Header description text */
  description: 'text-[11px] text-[hsl(var(--color-text-muted))] mt-0.5 leading-relaxed',
};

/**
 * Label styles
 */
export const labelStyles = {
  /** Standard label */
  base: cn(
    'text-xs font-medium text-[hsl(var(--color-text-secondary))]',
    'mb-1.5 flex items-center gap-1.5'
  ),

  /** Label with icon */
  withIcon: cn(
    'text-xs text-[hsl(var(--color-text-muted))]',
    'mb-2 flex items-center gap-1.5'
  ),

  /** Label icon */
  icon: 'w-3.5 h-3.5 text-[hsl(var(--color-text-muted))]',

  /** Required indicator */
  required: "after:content-['*'] after:ml-0.5 after:text-[hsl(var(--color-error))]",

  /** Helper text below inputs */
  helper: 'text-[10px] text-[hsl(var(--color-text-muted))] mt-1.5 leading-relaxed',
};

/**
 * Input/textarea styles (for custom inputs, not the Input component)
 */
export const inputStyles = {
  /** Base input styling */
  base: cn(
    'w-full px-3 py-2.5 text-sm',
    'bg-[hsl(var(--color-bg-base))]',
    'border border-[hsl(var(--color-border-default))] rounded-lg',
    'text-[hsl(var(--color-text-primary))]',
    'placeholder:text-[hsl(var(--color-placeholder))]',
    'focus:outline-none focus:border-[hsl(var(--color-accent-primary))]',
    'focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)]',
    'transition-all duration-150'
  ),

  /** Textarea specific */
  textarea: cn(
    'w-full px-3 py-2.5 text-sm min-h-[140px] resize-y',
    'bg-[hsl(var(--color-bg-base))]',
    'border border-[hsl(var(--color-border-default))] rounded-lg',
    'text-[hsl(var(--color-text-primary))] font-mono',
    'placeholder:text-[hsl(var(--color-placeholder))]',
    'focus:outline-none focus:border-[hsl(var(--color-accent-primary))]',
    'focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)]',
    'transition-all duration-150'
  ),

  /** Error state */
  error: 'border-[hsl(var(--color-error))] focus:border-[hsl(var(--color-error))] focus:ring-[hsl(var(--color-error)/0.15)]',
};

/**
 * Card/panel styles for grouped content
 */
export const cardStyles = {
  /** Default card */
  base: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-bg-muted)/0.5)]',
    'border border-[hsl(var(--color-border-default))]'
  ),

  /** Info card (neutral) */
  info: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-info)/0.06)]',
    'border border-[hsl(var(--color-info)/0.15)]'
  ),

  /** Success card */
  success: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-success)/0.06)]',
    'border border-[hsl(var(--color-success)/0.15)]'
  ),

  /** Warning card */
  warning: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-warning)/0.06)]',
    'border border-[hsl(var(--color-warning)/0.15)]'
  ),

  /** Primary accent card */
  primary: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-accent-primary)/0.06)]',
    'border border-[hsl(var(--color-accent-primary)/0.15)]'
  ),

  /** Card header with icon */
  cardHeader: 'flex items-center gap-2 mb-2.5',

  /** Card header icon */
  cardIcon: 'w-4 h-4',

  /** Card header title */
  cardTitle: 'text-xs font-semibold text-[hsl(var(--color-text-primary))]',

  /** Card body text */
  cardBody: 'text-[11px] text-[hsl(var(--color-text-muted))] leading-relaxed',

  /** Card list */
  cardList: 'text-[11px] text-[hsl(var(--color-text-muted))] space-y-1.5 mt-2',

  /** Card list item */
  cardListItem: 'flex items-start gap-2',

  /** Code highlight in card */
  cardCode: 'font-mono text-[hsl(var(--color-text-secondary))]',
};

/**
 * Button-like link styles
 */
export const linkStyles = {
  /** External link button */
  external: cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-bg-elevated)/0.6)]',
    'border border-[hsl(var(--color-border-default))]',
    'text-[hsl(var(--color-accent-primary))]',
    'hover:bg-[hsl(var(--color-accent-primary)/0.08)]',
    'hover:border-[hsl(var(--color-accent-primary)/0.25)]',
    'transition-all duration-150'
  ),

  /** External link icon */
  linkIcon: 'w-3 h-3',

  /** Inline link */
  inline: cn(
    'inline-flex items-center gap-1',
    'text-[10px] text-[hsl(var(--color-accent-primary))]',
    'hover:underline'
  ),
};

/**
 * Badge/tag styles
 */
export const badgeStyles = {
  /** Default badge */
  base: cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-bg-elevated))]',
    'text-[hsl(var(--color-text-secondary))]',
    'border border-[hsl(var(--color-border-default))]'
  ),

  /** Success badge */
  success: cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-success)/0.12)]',
    'text-[hsl(var(--color-success))]',
    'border border-[hsl(var(--color-success)/0.2)]'
  ),

  /** Warning badge */
  warning: cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-warning)/0.12)]',
    'text-[hsl(var(--color-warning))]',
    'border border-[hsl(var(--color-warning)/0.2)]'
  ),

  /** Error badge */
  error: cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-error)/0.12)]',
    'text-[hsl(var(--color-error))]',
    'border border-[hsl(var(--color-error)/0.2)]'
  ),

  /** Primary accent badge */
  primary: cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
    'text-[10px] font-medium',
    'bg-[hsl(var(--color-accent-primary)/0.12)]',
    'text-[hsl(var(--color-accent-primary))]',
    'border border-[hsl(var(--color-accent-primary)/0.2)]'
  ),
};

/**
 * Selection/toggle styles
 */
export const selectionStyles = {
  /** Selectable item (unchecked) */
  item: cn(
    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer',
    'bg-[hsl(var(--color-bg-base)/0.4)]',
    'border-[hsl(var(--color-border-default))]',
    'hover:bg-[hsl(var(--color-bg-muted))]',
    'hover:border-[hsl(var(--color-border-strong))]',
    'transition-all duration-150'
  ),

  /** Selectable item (checked) */
  itemSelected: cn(
    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer',
    'bg-[hsl(var(--color-success)/0.08)]',
    'border-[hsl(var(--color-success)/0.25)]',
    'hover:bg-[hsl(var(--color-success)/0.12)]',
    'transition-all duration-150'
  ),

  /** Checkbox container */
  checkbox: cn(
    'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5',
    'transition-colors duration-150'
  ),

  /** Checkbox unchecked */
  checkboxUnchecked: 'bg-[hsl(var(--color-border-default))] text-transparent',

  /** Checkbox checked */
  checkboxChecked: 'bg-[hsl(var(--color-success))] text-white',

  /** Checkbox icon */
  checkIcon: 'w-3 h-3',

  /** Selection item title */
  itemTitle: 'text-xs font-mono',

  /** Selection item description */
  itemDescription: 'text-[10px] text-[hsl(var(--color-text-muted))] mt-0.5 leading-relaxed',
};

/**
 * Status indicator styles
 */
export const statusStyles = {
  /** Connected/success state */
  connected: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-success)/0.06)]',
    'border border-[hsl(var(--color-success)/0.2)]'
  ),

  /** Disconnected/neutral state */
  disconnected: cn(
    'p-3.5 rounded-xl',
    'bg-[hsl(var(--color-bg-muted)/0.5)]',
    'border border-[hsl(var(--color-border-default))]'
  ),

  /** Status header */
  statusHeader: 'flex items-center gap-2 mb-2',

  /** Status icon */
  statusIcon: 'w-4 h-4',

  /** Status icon colors */
  statusIconConnected: 'text-[hsl(var(--color-success))]',
  statusIconDisconnected: 'text-[hsl(var(--color-text-muted))]',
  statusIconPrimary: 'text-[hsl(var(--color-accent-primary))]',

  /** Status title */
  statusTitle: 'text-sm font-medium text-[hsl(var(--color-text-primary))]',

  /** Status detail text */
  statusDetail: 'text-xs text-[hsl(var(--color-text-muted))]',

  /** Status value highlight */
  statusValue: 'text-[hsl(var(--color-text-primary))]',

  /** Status code highlight */
  statusCode: 'font-mono text-[hsl(var(--color-accent-primary))]',
};

/**
 * Action button row styles
 */
export const actionStyles = {
  /** Button row container */
  row: 'flex items-center gap-2 mt-3',

  /** Primary action button */
  primary: cn(
    'flex-1 px-3 py-2.5 rounded-lg',
    'text-xs font-medium',
    'bg-[hsl(var(--color-accent-primary))] text-white',
    'hover:bg-[hsl(var(--color-accent-primary)/0.9)]',
    'transition-colors duration-150'
  ),

  /** Secondary action button */
  secondary: cn(
    'flex-1 px-3 py-2.5 rounded-lg',
    'text-xs font-medium',
    'bg-[hsl(var(--color-bg-elevated))]',
    'text-[hsl(var(--color-text-primary))]',
    'border border-[hsl(var(--color-border-default))]',
    'hover:bg-[hsl(var(--color-bg-hover))]',
    'hover:border-[hsl(var(--color-border-strong))]',
    'transition-all duration-150'
  ),

  /** Ghost/tertiary action button */
  ghost: cn(
    'px-3 py-2.5 rounded-lg',
    'text-xs font-medium',
    'text-[hsl(var(--color-text-muted))]',
    'hover:text-[hsl(var(--color-text-primary))]',
    'hover:bg-[hsl(var(--color-bg-hover))]',
    'transition-all duration-150'
  ),

  /** Success action button */
  success: cn(
    'flex-1 px-3 py-2.5 rounded-lg',
    'text-xs font-medium',
    'bg-[hsl(var(--color-success)/0.15)]',
    'text-[hsl(var(--color-success))]',
    'hover:bg-[hsl(var(--color-success)/0.2)]',
    'transition-colors duration-150'
  ),
};

/**
 * Code block styles
 */
export const codeStyles = {
  /** Inline code */
  inline: cn(
    'px-1 py-0.5 rounded',
    'text-[10px] font-mono',
    'bg-[hsl(var(--color-bg-elevated)/0.6)]',
    'text-[hsl(var(--color-accent-primary))]'
  ),

  /** Code block */
  block: cn(
    'p-2.5 rounded-lg',
    'text-[10px] font-mono',
    'bg-[hsl(var(--color-bg-elevated)/0.6)]',
    'text-[hsl(var(--color-text-muted))]',
    'border border-[hsl(var(--color-border-subtle))]'
  ),
};

/**
 * Toggle row styles for switch/checkbox rows
 */
export const toggleRowStyles = {
  /** Row container with switch */
  row: cn(
    'flex items-center justify-between p-3 rounded-lg',
    'bg-[hsl(var(--color-bg-muted)/0.4)]',
    'border border-[hsl(var(--color-border-default))]',
    'transition-all duration-150',
    'hover:bg-[hsl(var(--color-bg-muted)/0.6)]'
  ),

  /** Toggle row title */
  title: 'text-xs font-medium text-[hsl(var(--color-text-primary))]',

  /** Toggle row description */
  description: 'text-[10px] text-[hsl(var(--color-text-muted))] mt-0.5',
};

/**
 * Section header styles
 */
export const sectionHeaderStyles = {
  /** Header container */
  wrapper: 'flex items-center gap-2 mb-2.5',

  /** Section icon */
  icon: 'w-4 h-4 text-[hsl(var(--color-text-muted))]',

  /** Section title */
  title: 'text-xs font-semibold text-[hsl(var(--color-text-secondary))] uppercase tracking-wide',
};

/**
 * Helper function to generate header with icon
 */
export function FormHeader({
  icon: Icon,
  title,
  description,
  variant = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  variant?: 'primary' | 'success' | 'info' | 'warning';
}) {
  const variantStyles = {
    primary: {
      wrapper: 'from-[hsl(var(--color-accent-primary)/0.08)] border-[hsl(var(--color-accent-primary)/0.15)]',
      iconContainer: 'bg-[hsl(var(--color-accent-primary)/0.12)] border-[hsl(var(--color-accent-primary)/0.2)]',
      icon: 'text-[hsl(var(--color-accent-primary))]',
    },
    success: {
      wrapper: 'from-[hsl(var(--color-success)/0.08)] border-[hsl(var(--color-success)/0.15)]',
      iconContainer: 'bg-[hsl(var(--color-success)/0.12)] border-[hsl(var(--color-success)/0.2)]',
      icon: 'text-[hsl(var(--color-success))]',
    },
    info: {
      wrapper: 'from-[hsl(var(--color-info)/0.08)] border-[hsl(var(--color-info)/0.15)]',
      iconContainer: 'bg-[hsl(var(--color-info)/0.12)] border-[hsl(var(--color-info)/0.2)]',
      icon: 'text-[hsl(var(--color-info))]',
    },
    warning: {
      wrapper: 'from-[hsl(var(--color-warning)/0.08)] border-[hsl(var(--color-warning)/0.15)]',
      iconContainer: 'bg-[hsl(var(--color-warning)/0.12)] border-[hsl(var(--color-warning)/0.2)]',
      icon: 'text-[hsl(var(--color-warning))]',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'flex items-start gap-3 p-3.5 rounded-xl',
      'bg-gradient-to-r via-[hsl(var(--color-bg-muted)/0.5)] to-transparent',
      'border',
      styles.wrapper
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        'border',
        styles.iconContainer
      )}>
        <Icon className={cn('w-4 h-4', styles.icon)} />
      </div>
      <div>
        <h3 className={headerStyles.title}>{title}</h3>
        {description && (
          <p className={headerStyles.description}>{description}</p>
        )}
      </div>
    </div>
  );
}
