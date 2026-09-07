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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { buildGroupPerformance } from '../lib/mock-stats'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatListPrice,
  formatPrice,
  getSiteDiscountPercent,
  stripTrailingZeros,
} from '../lib/price'
import {
  formatContextWindow,
  TEAMO_TABLE_PREVIEW_COUNT,
} from '../lib/teamo-display'
import type { PricingModel, TokenUnit } from '../types'

export interface TeamoPricingTableProps {
  models: PricingModel[]
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  onModelClick?: (modelName: string) => void
}

function DiscountBadge(props: { percent: number | null }) {
  const { t } = useTranslation()
  if (!props.percent) return null
  return (
    <span className='ml-1.5 inline-flex rounded-full bg-[var(--chuyi-ink,#141414)] px-1.5 py-0.5 text-[10px] font-semibold text-white'>
      {t('{{percent}}% off', { percent: props.percent })}
    </span>
  )
}

function PriceStack(props: {
  primary: string
  secondary?: string
  highlight?: boolean
  discount?: number | null
}) {
  return (
    <div className={cn(props.highlight && 'bg-[var(--chuyi-peach,#fff1e4)]')}>
      <div className='flex flex-wrap items-center font-medium'>
        <span className='tabular-nums'>{props.primary}</span>
        <DiscountBadge percent={props.discount ?? null} />
      </div>
      {props.secondary ? (
        <div className='text-muted-foreground mt-0.5 text-[11px]'>
          {props.secondary}
        </div>
      ) : null}
    </div>
  )
}

export function TeamoPricingTable(props: TeamoPricingTableProps) {
  const { t } = useTranslation()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const [expanded, setExpanded] = useState(false)
  const visibleModels = expanded
    ? props.models
    : props.models.slice(0, TEAMO_TABLE_PREVIEW_COUNT)
  const canToggle = props.models.length > TEAMO_TABLE_PREVIEW_COUNT

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white'>
        <table className='w-full min-w-[860px] border-collapse text-left text-sm'>
          <thead>
            <tr className='text-muted-foreground border-b border-[var(--chuyi-line,#e6e0d6)] text-xs'>
              <th className='px-4 py-3 font-medium'>{t('Model')}</th>
              <th className='px-3 py-3 font-medium'>{t('Context')}</th>
              <th className='px-3 py-3 font-medium'>{t('Input (list)')}</th>
              <th className='px-3 py-3 font-medium'>{t('Output (list)')}</th>
              <th className='bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3 font-medium'>
                {t('Input (Chuyi)')}
              </th>
              <th className='bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3 font-medium'>
                {t('Output (Chuyi)')}
              </th>
              <th className='px-3 py-3 font-medium'>{t('Provider')}</th>
              <th className='px-4 py-3 font-medium'>{t('Availability')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleModels.map((model) => {
              const discount = getSiteDiscountPercent(
                model,
                props.selectedGroup
              )
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
              const cachePrice = isTokenBasedModel(model)
                ? stripTrailingZeros(
                    formatPrice(
                      model,
                      'cache',
                      tokenUnit,
                      props.showRechargePrice,
                      priceRate,
                      usdExchangeRate,
                      props.selectedGroup
                    )
                  )
                : '-'
              const uptime = buildGroupPerformance(model)[0]?.uptime_30d_pct
              const vendorIcon = model.vendor_icon
                ? getLobeIcon(model.vendor_icon, 16)
                : null

              return (
                <tr
                  key={model.model_name}
                  className='cursor-pointer border-b border-dashed border-[var(--chuyi-line,#e6e0d6)] last:border-b-0 hover:bg-[var(--chuyi-cream,#fffefb)]'
                  onClick={() => props.onModelClick?.(model.model_name)}
                >
                  <td className='px-4 py-3'>
                    <div className='font-semibold'>{model.model_name}</div>
                    <div className='text-muted-foreground text-xs'>
                      {model.vendor_name || t('Unknown vendor')}
                    </div>
                  </td>
                  <td className='px-3 py-3 font-medium tabular-nums'>
                    {formatContextWindow(model.context_length)}
                  </td>
                  <td className='px-3 py-3'>
                    <PriceStack
                      primary={listInput}
                      secondary={
                        cachePrice !== '-'
                          ? `${t('Cache')} ${cachePrice}`
                          : undefined
                      }
                    />
                  </td>
                  <td className='px-3 py-3'>
                    <PriceStack primary={listOutput} />
                  </td>
                  <td className='bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3'>
                    <PriceStack
                      primary={siteInput}
                      secondary={
                        discount ? t('Tiered pricing may apply') : undefined
                      }
                      highlight
                      discount={discount}
                    />
                  </td>
                  <td className='bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3'>
                    <PriceStack
                      primary={siteOutput}
                      highlight
                      discount={discount}
                    />
                  </td>
                  <td className='px-3 py-3'>
                    <span className='inline-flex size-7 items-center justify-center rounded-full border border-[var(--chuyi-line,#e6e0d6)] bg-white'>
                      {vendorIcon ?? (
                        <span className='text-[10px] font-semibold'>
                          {(model.vendor_name || '·').slice(0, 1)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium tabular-nums'>
                        {uptime ? `${uptime.toFixed(2)}%` : '—'}
                      </span>
                      <span
                        className='h-1.5 w-10 overflow-hidden rounded-full bg-[var(--chuyi-line,#e6e0d6)]'
                        aria-hidden='true'
                      >
                        <span
                          className='block h-full rounded-full bg-gradient-to-r from-emerald-500 to-[var(--chuyi-orange,#ff6a00)]'
                          style={{
                            width: `${Math.min(100, Math.max(12, uptime ?? 0))}%`,
                          }}
                        />
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canToggle && (
        <div className='flex justify-center'>
          <Button
            type='button'
            variant='outline'
            className='rounded-full bg-white'
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t('Show less') : t('Show more')}
          </Button>
        </div>
      )}
    </div>
  )
}
