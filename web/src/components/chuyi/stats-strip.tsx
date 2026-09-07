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

import type { PublicStatItem } from './public-stats'
import { usePublicStats } from './use-public-stats'

interface StatsStripProps {
  items?: PublicStatItem[]
  className?: string
}

export function StatsStrip(props: StatsStripProps) {
  const { t } = useTranslation()
  const live = usePublicStats({ enabled: props.items == null })
  const items = props.items ?? live.items
  const isLoading = props.items == null && live.isLoading

  let body = (
    <div
      className={cn(
        'mx-auto grid max-w-6xl',
        items.length === 1 && 'grid-cols-1',
        items.length === 2 && 'grid-cols-1 sm:grid-cols-2',
        items.length === 3 && 'grid-cols-1 sm:grid-cols-3',
        items.length >= 4 && 'grid-cols-2 md:grid-cols-4'
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col items-center px-4 py-10 text-center',
            index % 2 === 1 &&
              'border-l border-dashed border-[var(--chuyi-line,#e6e0d6)]',
            index > 0 &&
              'md:border-l md:border-dashed md:border-[var(--chuyi-line,#e6e0d6)]'
          )}
        >
          <div className='text-2xl font-bold tracking-tight md:text-3xl'>
            {item.value}
          </div>
          <div className='text-muted-foreground mt-1.5 text-xs'>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )

  if (isLoading) {
    body = (
      <div className='mx-auto max-w-6xl px-4 py-10 text-center'>
        <div className='text-muted-foreground text-xs'>{t('Loading...')}</div>
      </div>
    )
  } else if (items.length === 0) {
    body = (
      <div className='mx-auto flex max-w-6xl flex-col items-center px-4 py-10 text-center'>
        <div className='text-2xl font-bold tracking-tight md:text-3xl'>
          {t('No stats yet')}
        </div>
        <div className='text-muted-foreground mt-1.5 text-xs'>
          {t('Live success rate appears after requests are recorded.')}
        </div>
      </div>
    )
  }

  return (
    <section
      aria-busy={isLoading}
      aria-live='polite'
      className={cn(
        'border-y border-dashed border-[var(--chuyi-line,#e6e0d6)]',
        props.className
      )}
    >
      {body}
    </section>
  )
}
