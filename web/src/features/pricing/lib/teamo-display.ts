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
import type { PricingModel, PricingVendor } from '../types'
import {
  parseTiersFromExpr,
  type ParsedTier,
  type TierCondition,
} from './billing-expr'
import { isTokenBasedModel } from './model-helpers'
import { getSiteDiscountPercent } from './price'

export function formatContextWindow(length?: number): string {
  if (!length || !Number.isFinite(length) || length <= 0) return '—'
  if (length >= 1_000_000) {
    const millions = length / 1_000_000
    return `${Number.isInteger(millions) ? millions.toFixed(0) : stripPointZero(millions)}M`
  }
  if (length >= 1000) {
    const thousands = length / 1000
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : stripPointZero(thousands)}K`
  }
  return String(length)
}

function stripPointZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

export const TEAMO_TABLE_PREVIEW_COUNT = 12
export const TEAMO_FEATURED_COUNT = 6

export function hasCachePrice(model: PricingModel): boolean {
  return (
    isTokenBasedModel(model) &&
    model.cache_ratio != null &&
    Number.isFinite(Number(model.cache_ratio))
  )
}

export function getMaxSiteDiscountPercent(
  models: PricingModel[],
  selectedGroup?: string
): number | null {
  let maxPercent: number | null = null
  for (const model of models) {
    const percent = getSiteDiscountPercent(model, selectedGroup)
    if (percent == null) continue
    if (maxPercent == null || percent > maxPercent) {
      maxPercent = percent
    }
  }
  return maxPercent
}

const TEAMO_VENDOR_RANK: Record<string, number> = {
  openai: 0,
  anthropic: 1,
  google: 2,
  kimi: 3,
  moonshot: 3,
  deepseek: 4,
  glm: 5,
  zhipu: 5,
  zhipuai: 5,
  'zhipu ai': 5,
  grok: 6,
  xai: 6,
  'x.ai': 6,
}

export function sortVendorsForPricingPills(
  vendors: PricingVendor[]
): PricingVendor[] {
  return [...vendors].sort((left, right) => {
    const leftRank =
      TEAMO_VENDOR_RANK[left.name.trim().toLowerCase()] ?? 100
    const rightRank =
      TEAMO_VENDOR_RANK[right.name.trim().toLowerCase()] ?? 100
    if (leftRank !== rightRank) return leftRank - rightRank
    return left.name.localeCompare(right.name)
  })
}

export function pickFeaturedModels(
  models: PricingModel[],
  options?: { limit?: number; selectedGroup?: string }
): PricingModel[] {
  const limit = options?.limit ?? TEAMO_FEATURED_COUNT
  if (limit <= 0) return []

  const tokenModels = models.filter(isTokenBasedModel)
  const discounted: PricingModel[] = []
  const others: PricingModel[] = []
  for (const model of tokenModels) {
    if (getSiteDiscountPercent(model, options?.selectedGroup) != null) {
      discounted.push(model)
    } else {
      others.push(model)
    }
  }

  discounted.sort((left, right) => {
    const leftPercent = getSiteDiscountPercent(left, options?.selectedGroup) ?? 0
    const rightPercent =
      getSiteDiscountPercent(right, options?.selectedGroup) ?? 0
    return rightPercent - leftPercent
  })

  const picked: PricingModel[] = []
  const usedVendors = new Set<string>()
  const passes = [discounted, others]

  for (const source of passes) {
    for (const model of source) {
      if (picked.length >= limit) break
      const vendor = model.vendor_name || String(model.vendor_id ?? model.model_name)
      if (usedVendors.has(vendor)) continue
      usedVendors.add(vendor)
      picked.push(model)
    }
  }

  if (picked.length < limit) {
    for (const source of passes) {
      for (const model of source) {
        if (picked.length >= limit) break
        if (picked.includes(model)) continue
        picked.push(model)
      }
    }
  }

  return picked
}

export function getContextLengthTiers(model: PricingModel): ParsedTier[] {
  if (model.billing_mode !== 'tiered_expr' || !model.billing_expr) {
    return []
  }
  const tiers = parseTiersFromExpr(model.billing_expr)
  const hasLengthTier = tiers.some((tier) =>
    tier.conditions.some((condition) => condition.var === 'len')
  )
  if (!hasLengthTier) return []
  return tiers
}

export function formatContextLengthCondition(
  conditions: TierCondition[],
  fallbackLabel: string
): string {
  const lengthCondition = conditions.find((condition) => condition.var === 'len')
  if (!lengthCondition) return fallbackLabel
  const window = formatContextWindow(lengthCondition.value)
  if (lengthCondition.op === '<=') return `≤ ${window}`
  if (lengthCondition.op === '<') return `< ${window}`
  if (lengthCondition.op === '>=') return `≥ ${window}`
  return `> ${window}`
}

export function getComplementContextLengthLabel(
  tiers: ParsedTier[]
): string | null {
  if (tiers.length !== 2) return null
  const lengthTiers = tiers.filter((tier) =>
    tier.conditions.some((condition) => condition.var === 'len')
  )
  if (lengthTiers.length !== 1) return null
  const lengthCondition = lengthTiers[0].conditions.find(
    (condition) => condition.var === 'len'
  )
  if (!lengthCondition) return null

  let complementOp: TierCondition['op'] = '>'
  if (lengthCondition.op === '<=') complementOp = '>'
  else if (lengthCondition.op === '<') complementOp = '>='
  else if (lengthCondition.op === '>') complementOp = '<='
  else complementOp = '<'

  return formatContextLengthCondition(
    [{ ...lengthCondition, op: complementOp }],
    ''
  )
}
