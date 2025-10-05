import { Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from './${componentName}.module.scss'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

// Component implementation

export { Spinner }
