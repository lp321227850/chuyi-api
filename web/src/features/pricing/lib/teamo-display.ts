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
import {
  isTokenBasedModel,
  modelAppliesToBillingGroup,
} from './model-helpers'
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

const MIN_CONFIGURED_CONTEXT = 4_000
const MAX_CONFIGURED_CONTEXT = 10_000_000

const CONTEXT_LABEL_BEFORE =
  /(?:context(?:\s*window)?|ctx|上下文(?:窗口)?)[:\s：-]*([0-9]+(?:\.[0-9]+)?)\s*([kKmM])\b/i
const CONTEXT_LABEL_AFTER =
  /([0-9]+(?:\.[0-9]+)?)\s*([kKmM])\s*(?:context(?:\s*window)?|ctx|上下文(?:窗口)?)/i
const CONTEXT_TOKEN_COUNT =
  /(?:context(?:\s*window)?|ctx|上下文(?:窗口)?)[:\s：-]*([0-9]{4,})\b/i
const NAME_CONTEXT_WINDOW =
  /(?:^|[-_/])(\d{2,})([kK])(?:[-_/]|$)|(?:^|[-_/])(\d+(?:\.\d+)?)([mM])(?:[-_/]|$)/g

function tokensFromWindowAmount(amount: number, unit: string): number | undefined {
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  const lower = unit.toLowerCase()
  let tokens = amount
  if (lower === 'k') tokens = amount * 1_000
  if (lower === 'm') tokens = amount * 1_000_000
  if (tokens < MIN_CONFIGURED_CONTEXT || tokens > MAX_CONFIGURED_CONTEXT) {
    return undefined
  }
  return tokens
}

function parseContextLengthFromText(text: string): number | undefined {
  if (!text.trim()) return undefined
  const labeled = text.match(CONTEXT_LABEL_BEFORE) ?? text.match(CONTEXT_LABEL_AFTER)
  if (labeled) {
    const tokens = tokensFromWindowAmount(Number(labeled[1]), labeled[2])
    if (tokens != null) return tokens
  }
  const tokenCount = text.match(CONTEXT_TOKEN_COUNT)
  if (tokenCount) {
    const tokens = Number(tokenCount[1])
    if (
      Number.isFinite(tokens) &&
      tokens >= MIN_CONFIGURED_CONTEXT &&
      tokens <= MAX_CONFIGURED_CONTEXT
    ) {
      return tokens
    }
  }
  return undefined
}

function parseContextLengthFromModelName(name: string): number | undefined {
  NAME_CONTEXT_WINDOW.lastIndex = 0
  let match: RegExpExecArray | null
  let found: number | undefined
  while ((match = NAME_CONTEXT_WINDOW.exec(name)) != null) {
    const amount = Number(match[1] || match[3])
    const unit = match[2] || match[4]
    const tokens = tokensFromWindowAmount(amount, unit)
    if (tokens != null) found = tokens
  }
  return found
}

export function resolveConfiguredContextLength(
  model: PricingModel
): number | undefined {
  if (
    model.context_length != null &&
    Number.isFinite(model.context_length) &&
    model.context_length > 0
  ) {
    return model.context_length
  }
  const fromText = parseContextLengthFromText(
    [model.description, model.tags].filter(Boolean).join(' ')
  )
  if (fromText != null) return fromText
  return parseContextLengthFromModelName(model.model_name)
}

export function perfModelAliases(name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return []
  const lower = trimmed.toLowerCase()
  const aliases = new Set<string>([trimmed, lower])
  const parts = lower.split('/')
  if (parts.length > 1) {
    aliases.add(parts.at(-1) ?? '')
    aliases.add(parts.slice(1).join('/'))
  }
  return [...aliases].filter(Boolean)
}

export function lookupNamedRecord<T>(
  record: Record<string, T>,
  name: string
): T | undefined {
  if (Object.hasOwn(record, name)) return record[name]
  const wanted = new Set(perfModelAliases(name))
  for (const [key, value] of Object.entries(record)) {
    if (perfModelAliases(key).some((alias) => wanted.has(alias))) {
      return value
    }
  }
  return undefined
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
    if (!modelAppliesToBillingGroup(model, selectedGroup)) continue
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

  const tokenModels = models.filter(
    (model) =>
      isTokenBasedModel(model) &&
      modelAppliesToBillingGroup(model, options?.selectedGroup)
  )
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
