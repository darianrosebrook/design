import { Loader2Icon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import styles from './spinner.module.scss'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  styles.spinner,
  {
    variants: {
      size: {
        sm: styles['spinner--size-sm'],
        md: styles['spinner--size-md'],
        lg: styles['spinner--size-lg'],
        xl: styles['spinner--size-xl'],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface SpinnerProps
  extends React.ComponentProps<'svg'>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  )
}

// Component implementation

export { Spinner, spinnerVariants, type SpinnerProps }
