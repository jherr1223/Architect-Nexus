import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<'label'>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-stone-700', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
