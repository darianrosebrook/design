import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "./ButtonGroup.module.scss";
import { cn } from "@/lib/utils";
import { Separator } from "@/ui/primitives/Separator";

const buttonGroupVariants = cva(
  // Base styles now in SCSS - keeping Tailwind commented for reference
  // "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2",
  styles.buttonGroup,
  {
    variants: {
      orientation: {
        // Tailwind versions commented for reference:
        // horizontal: "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        // vertical: "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",

        horizontal: styles["buttonGroup--orientation-horizontal"],
        vertical: styles["buttonGroup--orientation-vertical"],
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

export interface ButtonGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof buttonGroupVariants> {}

function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export interface ButtonGroupTextProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: ButtonGroupTextProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      // Original Tailwind classes (commented for reference):
      // "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
      className={cn(styles.buttonGroupText, className)}
      {...props}
    />
  );
}

export interface ButtonGroupSeparatorProps
  extends React.ComponentProps<typeof Separator> {
  orientation?: "horizontal" | "vertical";
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      // Original Tailwind classes (commented for reference):
      // "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto"
      className={cn(styles.buttonGroupSeparator, className)}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
  type ButtonGroupProps,
  type ButtonGroupTextProps,
  type ButtonGroupSeparatorProps,
};
