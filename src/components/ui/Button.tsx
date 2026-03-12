/**
 * Shared button styles aligned with Delivery page (amber primary).
 * Use these classes or the Button component for consistent actions across site and admin.
 */
import { forwardRef } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

export const buttonVariants = {
  primary: `${base} bg-amber-50 border border-amber-200/90 px-5 py-2.5 text-stone-800 hover:bg-amber-100/90 active:bg-amber-100`,
  secondary: `${base} border border-amber-200/80 bg-white px-5 py-2.5 text-stone-700 hover:bg-amber-50/80 active:bg-amber-50`,
  ghost: `${base} text-stone-600 hover:bg-amber-50/80 hover:text-stone-800 px-4 py-2.5`,
  danger: `${base} bg-red-50 border border-red-200 px-5 py-2.5 text-red-700 hover:bg-red-100 active:bg-red-100`,
  dangerSolid: `${base} bg-red-600 text-white border border-red-600 px-5 py-2.5 hover:bg-red-700 active:bg-red-700`,
  link: `${base} text-stone-600 hover:text-amber-800 px-0 py-0 focus:ring-0 focus:ring-offset-0`,
} as const;

type ButtonVariant = keyof typeof buttonVariants;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", asChild, children, ...props }, ref) => {
    const classes = `${buttonVariants[variant]} ${className}`.trim();
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
