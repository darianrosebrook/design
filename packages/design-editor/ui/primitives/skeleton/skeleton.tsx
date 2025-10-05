import { cn } from '@/lib/utils'
import styles from './${componentName}.module.scss'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

// Component implementation

export { Skeleton }
