import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
  {
    variants: {
      variant: {
        draft: 'border-stone-300 bg-stone-100 text-stone-700',
        'in-review': 'border-amber-200 bg-amber-50 text-amber-800',
        approved: 'border-teal-200 bg-teal-50 text-teal-800',
        deprecated: 'border-rose-200 bg-rose-50 text-rose-800',
        outline: 'border-border bg-card text-muted-foreground'
      }
    },
    defaultVariants: {
      variant: 'outline'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
