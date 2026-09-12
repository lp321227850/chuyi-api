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

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import {
  formatDiscountFold,
  formatDiscountPercent,
} from '../lib/price'

export function DiscountFoldBadge(props: {
  ratio?: number | null
  className?: string
}) {
  const { t } = useTranslation()
  if (props.ratio == null) return null
  const fold = formatDiscountFold(props.ratio)
  const percent = formatDiscountPercent(props.ratio)
  if (fold == null || percent == null) return null
  return (
    <Badge
      variant='default'
      className={cn(
        'ml-1.5 h-auto rounded-[3px] border-transparent bg-[var(--chuyi-ink,#141414)] px-1.5 py-1 text-xs font-semibold text-white',
        props.className
      )}
    >
      {t('{{percent}}% off', { percent, fold })}
    </Badge>
  )
}
