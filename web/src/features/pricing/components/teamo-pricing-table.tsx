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
import { useQuery } from '@tanstack/react-query'
import { CircleHelp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { fetchPublicPerfSummary } from '@/components/chuyi/public-stats'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatUptimePct,
  getSuccessRateLevel,
} from '@/features/performance-metrics/lib/format'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { formatDynamicUnitPrice } from '../lib/dynamic-price'
import { getDisplayGroupRatio } from '../lib/model-helpers'
import {
  formatListPrice,
  formatPrice,
  getSiteDiscountFold,
  stripTrailingZeros,
} from '../lib/price'
import {
  formatContextLengthCondition,
  formatContextWindow,
  getComplementContextLengthLabel,
  getContextLengthTiers,
  hasCachePrice,
  lookupNamedRecord,
  resolveConfiguredContextLength,
  TEAMO_TABLE_PREVIEW_COUNT,
} from '../lib/teamo-display'
import type { PricingModel, TokenUnit } from '../types'
import { DiscountFoldBadge } from './discount-fold-badge'

export interface TeamoPricingTableProps {
  models: PricingModel[]
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  onModelClick?: (modelName: string) => void
  successRates?: Record<string, number>
  recentSuccessRates?: Record<string, number[]>
}

function PriceStack(props: {
  primary: string
  secondary?: string
  extra?: ReactNode
  muted?: boolean
  accentSecondary?: boolean
  fold?: string | null
}) {
  return (
    <div>
      <div
        className={cn(
          'flex flex-wrap items-center',
          props.muted ? 'text-muted-foreground' : 'font-bold'
        )}
      >
        <span className='tabular-nums'>{props.primary}</span>
        <DiscountFoldBadge fold={props.fold ?? null} />
      </div>
      {props.secondary ? (
        <div
          className={cn(
            'mt-0.5 text-[11px]',
            props.accentSecondary
              ? 'text-[var(--chuyi-orange,#ff6a00)]'
              : 'text-muted-foreground'
          )}
        >
          {props.secondary}
        </div>
      ) : null}
      {props.extra}
    </div>
  )
}

function ContextTierHint(props: {
  model: PricingModel
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
  priceRate: number
  usdExchangeRate: number
  selectedGroup?: string
}) {
  const { t } = useTranslation()
  const tiers = getContextLengthTiers(props.model)
  if (tiers.length === 0) return null

  const groupRatio = getDisplayGroupRatio(props.model, props.selectedGroup)
  const unit = props.tokenUnit
  const complementLabel = getComplementContextLengthLabel(tiers)

  return (
    <Tooltip>
      <TooltipTrigger
        className='mt-1 inline-flex items-center gap-0.5 text-[11px] text-[var(--chuyi-orange,#ff6a00)] underline decoration-dashed underline-offset-2 hover:text-[var(--chuyi-ink,#141414)]'
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {t('Context-tiered pricing')}
        <CircleHelp className='size-3' aria-hidden />
      </TooltipTrigger>
      <TooltipContent
        side='bottom'
        align='start'
        className='bg-white text-[var(--chuyi-ink,#141414)] max-w-xs flex-col items-stretch gap-2 rounded-xl border border-[var(--chuyi-line,#e6e0d6)] p-3 text-xs shadow-md'
      >
        <div className='font-semibold'>
          {t('Tiered by the context length of each request')}
        </div>
        <table className='w-full border-collapse text-left'>
          <thead>
            <tr className='text-muted-foreground'>
              <th className='pr-3 pb-1 font-medium'>{t('Context')}</th>
              <th className='px-2 pb-1 font-medium'>
                {t('Input / {{unit}}', { unit })}
              </th>
              <th className='pl-2 pb-1 font-medium'>
                {t('Output / {{unit}}', { unit })}
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => {
              const inputValue = Number(tier.inputPrice)
              const outputValue = Number(tier.outputPrice)
              let inputLabel = '—'
              if (Number.isFinite(inputValue) && inputValue > 0) {
                inputLabel = stripTrailingZeros(
                  formatDynamicUnitPrice(inputValue, {
                    tokenUnit: props.tokenUnit,
                    showRechargePrice: props.showRechargePrice,
                    priceRate: props.priceRate,
                    usdExchangeRate: props.usdExchangeRate,
                    groupRatioMultiplier: groupRatio,
                  })
                )
              }
              let outputLabel = '—'
              if (Number.isFinite(outputValue) && outputValue > 0) {
                outputLabel = stripTrailingZeros(
                  formatDynamicUnitPrice(outputValue, {
                    tokenUnit: props.tokenUnit,
                    showRechargePrice: props.showRechargePrice,
                    priceRate: props.priceRate,
                    usdExchangeRate: props.usdExchangeRate,
                    groupRatioMultiplier: groupRatio,
                  })
                )
              }
              return (
                <tr key={tier.label}>
                  <td className='pr-3 pt-1'>
                    {formatContextLengthCondition(
                      tier.conditions,
                      complementLabel || tier.label
                    )}
                  </td>
                  <td className='px-2 pt-1 font-semibold tabular-nums'>
                    {inputLabel}
                  </td>
                  <td className='pl-2 pt-1 font-semibold tabular-nums'>
                    {outputLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  )
}

function slaBarHeightClass(rate: number): string {
  if (rate >= 99) return 'h-8'
  if (rate >= 95) return 'h-7'
  if (rate >= 90) return 'h-6'
  if (rate >= 70) return 'h-5'
  return 'h-4'
}

function slaBarToneClass(rate: number): string {
  const level = getSuccessRateLevel(rate)
  if (level === 'warning') return 'bg-amber-500'
  if (level === 'critical') return 'bg-red-600'
  return 'bg-emerald-600'
}

function SuccessHealthCell(props: { rate?: number; samples?: number[] }) {
  const { t } = useTranslation()
  const rate = props.rate
  const hasRate =
    rate != null && Number.isFinite(rate) && rate >= 0 && rate <= 100
  const samples = (props.samples ?? []).filter(
    (sample) => Number.isFinite(sample) && sample >= 0 && sample <= 100
  )
  let barRates = samples
  if (barRates.length === 0 && hasRate) {
    barRates = [rate]
  }
  const seenRates = new Map<number, number>()
  const labeledSamples = barRates.map((sample) => {
    const count = (seenRates.get(sample) ?? 0) + 1
    seenRates.set(sample, count)
    return { rate: sample, key: `${sample}:${count}` }
  })

  return (
    <div>
      <span
        className='font-semibold tabular-nums'
        title={t('24h request success rate')}
      >
        {hasRate ? formatUptimePct(rate) : '—'}
      </span>
      {labeledSamples.length > 0 ? (
        <div
          role='img'
          aria-label={t('Recent success-rate samples')}
          className='mt-1.5 flex h-8 items-end gap-1'
        >
          {labeledSamples.map((sample) => (
            <span
              key={sample.key}
              aria-hidden
              className={cn(
                'w-2.5 rounded-sm',
                slaBarHeightClass(sample.rate),
                slaBarToneClass(sample.rate)
              )}
            />
          ))}
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
  const perfQuery = useQuery({
    queryKey: ['perf-metrics-summary', 24],
    queryFn: fetchPublicPerfSummary,
    staleTime: 60 * 1000,
    retry: false,
    enabled: props.successRates == null,
  })
  const successRates = useMemo(() => {
    if (props.successRates) return props.successRates
    const map: Record<string, number> = {}
    for (const model of perfQuery.data?.data?.models ?? []) {
      if (
        Number.isFinite(model.success_rate) &&
        model.success_rate >= 0 &&
        model.success_rate <= 100
      ) {
        map[model.model_name] = model.success_rate
      }
    }
    return map
  }, [perfQuery.data?.data?.models, props.successRates])
  const recentSuccessRates = useMemo(() => {
    if (props.recentSuccessRates) return props.recentSuccessRates
    const map: Record<string, number[]> = {}
    for (const model of perfQuery.data?.data?.models ?? []) {
      const samples = (model.recent_success_rates ?? []).filter(
        (rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100
      )
      if (samples.length > 0) {
        map[model.model_name] = samples
      }
    }
    return map
  }, [perfQuery.data?.data?.models, props.recentSuccessRates])

  return (
    <div className='space-y-4'>
      <TooltipProvider delay={100}>
        <div data-chuyi-pricing-table=''>
          <table className='w-full min-w-[920px] border-collapse text-left text-sm'>
            <thead>
              <tr className='text-muted-foreground border-b border-dashed border-[var(--chuyi-line,#e6e0d6)] text-xs'>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'>
                  {t('Model')}
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'>
                  {t('Context')}
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'>
                  {t('Input (list)')}
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'>
                  {t('Output (list)')}
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3 font-medium'>
                  {t('Input (Chuyi)')}
                  <span
                    aria-hidden
                    className='absolute inset-x-0 bottom-0 h-0.5 bg-[var(--chuyi-cyan,#c8e8ee)]'
                  />
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-lavender,#eef1ff)] px-3 py-3 font-medium'>
                  {t('Output (Chuyi)')}
                  <span
                    aria-hidden
                    className='absolute inset-x-0 bottom-0 h-0.5 bg-[var(--chuyi-cyan,#c8e8ee)]'
                  />
                </th>
                <th className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'>
                  {t('Provider')}
                </th>
                <th
                  className='sticky top-[var(--chuyi-header-offset,5.25rem)] z-20 bg-[var(--chuyi-cream,#fffefb)] px-3 py-3 font-medium'
                  title={t('24h request success rate')}
                >
                  {t('Uptime (SLA)')}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleModels.map((model, index) => {
                const fold = getSiteDiscountFold(model, props.selectedGroup)
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
                let listCache: string | undefined
                let siteCache: string | undefined
                if (hasCachePrice(model)) {
                  listCache = t('Cache {{price}}', {
                    price: stripTrailingZeros(
                      formatListPrice(
                        model,
                        'cache',
                        tokenUnit,
                        props.showRechargePrice,
                        priceRate,
                        usdExchangeRate
                      )
                    ),
                  })
                  siteCache = t('Cache {{price}}', {
                    price: stripTrailingZeros(
                      formatPrice(
                        model,
                        'cache',
                        tokenUnit,
                        props.showRechargePrice,
                        priceRate,
                        usdExchangeRate,
                        props.selectedGroup
                      )
                    ),
                  })
                }
                const vendorIcon = model.vendor_icon
                  ? getLobeIcon(model.vendor_icon, 16)
                  : null
                const tierHint = (
                  <ContextTierHint
                    model={model}
                    tokenUnit={tokenUnit}
                    showRechargePrice={props.showRechargePrice}
                    priceRate={priceRate}
                    usdExchangeRate={usdExchangeRate}
                    selectedGroup={props.selectedGroup}
                  />
                )

                return (
                  <tr
                    key={model.model_name}
                    className='chuyi-table-row cursor-pointer border-b border-dashed border-[var(--chuyi-line,#e6e0d6)] last:border-b-0 hover:bg-[var(--chuyi-cream,#fffefb)]'
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => props.onModelClick?.(model.model_name)}
                  >
                    <td className='px-3 py-3'>
                      <div className='font-semibold'>{model.model_name}</div>
                      <div className='text-muted-foreground text-xs'>
                        {model.vendor_name || t('Unknown vendor')}
                      </div>
                    </td>
                    <td className='text-muted-foreground px-3 py-3 tabular-nums'>
                      {formatContextWindow(
                        resolveConfiguredContextLength(model)
                      )}
                    </td>
                    <td className='px-3 py-3'>
                      <PriceStack
                        primary={listInput}
                        secondary={listCache}
                        muted
                      />
                    </td>
                    <td className='px-3 py-3'>
                      <PriceStack primary={listOutput} muted />
                    </td>
                    <td className='bg-[var(--chuyi-peach,#fff1e4)] px-3 py-3'>
                      <PriceStack
                        primary={siteInput}
                        secondary={siteCache}
                        extra={tierHint}
                        accentSecondary
                        fold={fold}
                      />
                    </td>
                    <td className='bg-[var(--chuyi-lavender,#eef1ff)] px-3 py-3'>
                      <PriceStack
                        primary={siteOutput}
                        extra={tierHint}
                        fold={fold}
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
                    <td className='px-3 py-3'>
                      <SuccessHealthCell
                        rate={lookupNamedRecord(successRates, model.model_name)}
                        samples={lookupNamedRecord(
                          recentSuccessRates,
                          model.model_name
                        )}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      {canToggle && (
        <div className='flex justify-center'>
          <Button
            type='button'
            variant='outline'
            className='chuyi-press rounded-full border-[var(--chuyi-ink,#141414)] bg-white'
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t('Show less') : t('Show more')}
          </Button>
        </div>
      )}
    </div>
  )
}
