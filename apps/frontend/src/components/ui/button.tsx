import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover border border-transparent',
  secondary:
    'border border-border bg-surface text-foreground hover:bg-[var(--overlay)]',
  ghost:
    'border border-transparent text-muted hover:text-foreground hover:bg-[var(--overlay)]',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

function buttonClassName(
  variant: Variant,
  size: Size,
  className?: string,
): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={buttonClassName(variant, size, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </a>
  );
}
