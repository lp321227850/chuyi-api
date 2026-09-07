/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'size-7 text-[13px]',
  md: 'size-8 text-sm',
  lg: 'size-12 text-lg',
} as const

export function BrandMark(props: BrandMarkProps) {
  const { t } = useTranslation()
  const size = props.size ?? 'sm'

  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[var(--chuyi-ink,#141414)] font-semibold text-[var(--chuyi-cream,#fffefb)]',
        SIZE_CLASS[size],
        props.className
      )}
      title={t('Chuyi API')}
    >
      初
    </span>
  )
}
