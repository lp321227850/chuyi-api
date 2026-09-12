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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { FILTER_ALL } from '../constants'
import { sortVendorsForPricingPills } from '../lib/teamo-display'
import type { PricingVendor } from '../types'

interface VendorFilterPillsProps {
  vendors: PricingVendor[]
  value: string
  onChange: (vendor: string) => void
}

export function VendorFilterPills(props: VendorFilterPillsProps) {
  const { t } = useTranslation()
  const pills = [
    { value: FILTER_ALL, label: t('Featured'), icon: null as ReactNode },
    ...sortVendorsForPricingPills(props.vendors).map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
      icon: vendor.icon ? getLobeIcon(vendor.icon, 14) : null,
    })),
  ]

  return (
    <div
      className='flex flex-wrap items-center gap-2'
      role='tablist'
      aria-label={t('Filter by provider')}
    >
      {pills.map((pill) => {
        const selected = props.value === pill.value
        return (
          <Button
            key={pill.value}
            type='button'
            role='tab'
            aria-selected={selected}
            variant={selected ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'chuyi-pill h-8 rounded-full px-3 text-xs',
              selected ? 'bg-[var(--chuyi-ink,#141414)] text-white' : 'bg-white'
            )}
            onClick={() => props.onChange(pill.value)}
          >
            {pill.icon}
            {pill.label}
          </Button>
        )
      })}
    </div>
  )
}
