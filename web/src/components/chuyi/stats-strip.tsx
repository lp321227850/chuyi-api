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

interface StatsStripItem {
  value: string
  label: string
}

interface StatsStripProps {
  items?: StatsStripItem[]
  className?: string
}

export function StatsStrip(props: StatsStripProps) {
  const { t } = useTranslation()
  const items = props.items ?? [
    {
      value: '796B+',
      label: t('Tokens routed yesterday'),
    },
    {
      value: '>99%',
      label: t('Prompt cache hit rate'),
    },
    {
      value: '99.98%',
      label: t('30-day availability'),
    },
    {
      value: 'Hours',
      label: t('From integration to production-ready'),
    },
  ]

  return (
    <section
      className={cn(
        'border-y border-dashed border-[var(--chuyi-line,#e6e0d6)]',
        props.className
      )}
    >
      <div className='mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4'>
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
    </section>
  )
}
