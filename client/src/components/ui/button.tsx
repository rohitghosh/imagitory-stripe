import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform hover:scale-105 font-handwritten",
  {
    variants: {
      variant: {
        default: "bg-imaginory-yellow text-imaginory-black hover:bg-yellow-400 border border-imaginory-black shadow-lg hover:shadow-xl",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 border border-red-600 shadow-lg hover:shadow-xl",
        outline:
          "border border-gray-300 bg-background hover:bg-gray-100 text-imaginory-black",
        secondary:
          "bg-gray-100 text-imaginory-black hover:bg-gray-200 border border-gray-300 shadow-lg hover:shadow-xl",
        ghost: "hover:bg-gray-100 text-imaginory-black",
        link: "text-imaginory-yellow underline-offset-4 hover:underline",
        playful: "bg-imaginory-yellow text-imaginory-black border border-imaginory-black shadow-lg hover:shadow-xl hover:bg-yellow-400",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-10 text-lg",
        xl: "h-16 rounded-3xl px-12 text-xl",
        xs: "h-8 rounded-lg px-3 text-xs",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
