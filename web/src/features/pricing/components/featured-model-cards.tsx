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

import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  formatListPrice,
  formatPrice,
  getSiteDiscountFold,
  stripTrailingZeros,
} from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { DiscountFoldBadge } from './discount-fold-badge'

export interface FeaturedModelCardsProps {
  models: PricingModel[]
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  onModelClick?: (modelName: string) => void
}

export function FeaturedModelCards(props: FeaturedModelCardsProps) {
  const { t } = useTranslation()
  if (props.models.length === 0) return null

  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const unitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1

  return (
    <div className='mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {props.models.map((model, index) => {
        const vendorIcon = model.vendor_icon
          ? getLobeIcon(model.vendor_icon, 20)
          : null
        const listInput = stripTrailingZeros(
          formatListPrice(
            model,
            'input',
            tokenUnit,
            props.showRechargePrice,
            priceRate,
            usdExchangeRate
          )
        )
        const listOutput = stripTrailingZeros(
          formatListPrice(
            model,
            'output',
            tokenUnit,
            props.showRechargePrice,
            priceRate,
            usdExchangeRate
          )
        )
        const siteInput = stripTrailingZeros(
          formatPrice(
            model,
            'input',
            tokenUnit,
            props.showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )
        )
        const siteOutput = stripTrailingZeros(
          formatPrice(
            model,
            'output',
            tokenUnit,
            props.showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )
        )
        const fold = getSiteDiscountFold(model, props.selectedGroup)

        return (
          <button
            key={model.model_name}
            type='button'
            className={cn(
              'chuyi-lift chuyi-enter rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4 text-left',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
            )}
            style={{ animationDelay: `${index * 40}ms` }}
            onClick={() => props.onModelClick?.(model.model_name)}
          >
            <div className='mb-3 flex items-center gap-2.5'>
              <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--chuyi-line,#e6e0d6)] bg-[var(--chuyi-cream,#fffefb)]'>
                {vendorIcon ?? (
                  <span className='text-xs font-semibold'>
                    {(model.vendor_name || model.model_name).slice(0, 1)}
                  </span>
                )}
              </span>
              <div className='min-w-0'>
                <div className='truncate font-semibold'>{model.model_name}</div>
                <div className='text-muted-foreground truncate text-xs'>
                  {model.vendor_name || t('Unknown vendor')}
                </div>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <FeaturedPricePair
                label={t('Input / {{unit}} tokens', { unit: unitLabel })}
                listPrice={listInput}
                sitePrice={siteInput}
                fold={fold}
              />
              <FeaturedPricePair
                label={t('Output / {{unit}} tokens', { unit: unitLabel })}
                listPrice={listOutput}
                sitePrice={siteOutput}
                fold={fold}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function FeaturedPricePair(props: {
  label: string
  listPrice: string
  sitePrice: string
  fold: string | null
}) {
  return (
    <div>
      <div className='text-muted-foreground mb-1 text-[11px]'>{props.label}</div>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
        {props.listPrice !== '-' ? (
          <span className='text-muted-foreground text-sm tabular-nums'>
            {props.listPrice}
          </span>
        ) : null}
        <span className='text-lg font-bold tabular-nums'>{props.sitePrice}</span>
        <DiscountFoldBadge fold={props.fold} className='ml-0' />
      </div>
    </div>
  )
}
