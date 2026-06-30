import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

function Badge({ className, ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-[#F9FAFB]', className)} {...props} />;
}

export { Badge };
