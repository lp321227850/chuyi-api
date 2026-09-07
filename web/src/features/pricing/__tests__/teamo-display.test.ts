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
import { describe, expect, it } from 'vitest'

import { getDisplayGroupRatio } from '../lib/model-helpers'
import {
  formatDiscountFold,
  formatDiscountPercent,
  formatListPrice,
  formatPrice,
  getMaxSiteDiscountFold,
  getSiteDiscountFold,
  getSiteDiscountPercent,
  stripTrailingZeros,
} from '../lib/price'
import {
  formatContextLengthCondition,
  formatContextWindow,
  getComplementContextLengthLabel,
  getContextLengthTiers,
  getMaxSiteDiscountPercent,
  hasCachePrice,
  lookupNamedRecord,
  pickFeaturedModels,
  resolveConfiguredContextLength,
  sortVendorsForPricingPills,
} from '../lib/teamo-display'
import type { PricingModel } from '../types'

function model(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'demo-model',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    enable_groups: ['default'],
    group_ratio: { default: 1 },
    ...overrides,
  }
}

describe('formatContextWindow', () => {
  it('returns an em dash when context length is missing', () => {
    expect(formatContextWindow(undefined)).toBe('—')
    expect(formatContextWindow(0)).toBe('—')
  })

  it('formats million-token and thousand-token windows', () => {
    expect(formatContextWindow(1_000_000)).toBe('1M')
    expect(formatContextWindow(200_000)).toBe('200K')
    expect(formatContextWindow(512)).toBe('512')
  })
})

describe('resolveConfiguredContextLength', () => {
  it('prefers an explicit context_length field', () => {
    expect(
      resolveConfiguredContextLength(
        model({
          context_length: 128_000,
          description: 'Official 200K context window',
        })
      )
    ).toBe(128_000)
  })

  it('reads a configured window from description or tags', () => {
    expect(
      resolveConfiguredContextLength(
        model({ description: 'Official 200K context window' })
      )
    ).toBe(200_000)
    expect(
      resolveConfiguredContextLength(model({ tags: 'chat, context:1m' }))
    ).toBe(1_000_000)
  })

  it('reads a configured window encoded in the model name', () => {
    expect(
      resolveConfiguredContextLength(model({ model_name: 'gpt-4-32k' }))
    ).toBe(32_000)
  })

  it('does not invent a window from unrelated catalog text', () => {
    expect(
      resolveConfiguredContextLength(
        model({
          model_name: 'gpt-4o',
          description: 'Flagship chat model',
          tags: 'vision',
        })
      )
    ).toBeUndefined()
  })
})

describe('lookupNamedRecord', () => {
  it('matches vendor-prefixed and case-shifted model names', () => {
    const rates = { 'OpenAI/gpt-4o': 97.5, 'claude-sonnet-4': 99.1 }
    expect(lookupNamedRecord(rates, 'gpt-4o')).toBe(97.5)
    expect(lookupNamedRecord(rates, 'openai/GPT-4O')).toBe(97.5)
    expect(lookupNamedRecord(rates, 'Claude-Sonnet-4')).toBe(99.1)
    expect(lookupNamedRecord(rates, 'missing-model')).toBeUndefined()
  })
})

describe('getSiteDiscountPercent', () => {
  it('returns null when the displayed group ratio is full price', () => {
    expect(getSiteDiscountPercent(model())).toBeNull()
  })

  it('returns a percent off when the best group ratio is below 1', () => {
    expect(
      getSiteDiscountPercent(
        model({
          enable_groups: ['vip'],
          group_ratio: { vip: 0.1 },
        })
      )
    ).toBe(90)
  })
})

describe('hasCachePrice', () => {
  it('is true only for token models with a finite cache ratio', () => {
    expect(hasCachePrice(model({ cache_ratio: 0.1 }))).toBe(true)
    expect(hasCachePrice(model({ cache_ratio: null }))).toBe(false)
    expect(hasCachePrice(model({ quota_type: 1, cache_ratio: 0.1 }))).toBe(
      false
    )
  })
})

describe('formatDiscountFold', () => {
  it('converts a real group ratio into a Chinese fold number', () => {
    expect(formatDiscountFold(0.08)).toBe('0.8')
    expect(formatDiscountFold(0.11)).toBe('1.1')
    expect(formatDiscountFold(0.1)).toBe('1')
    expect(formatDiscountFold(0.59)).toBe('5.9')
    expect(formatDiscountFold(1)).toBeNull()
    expect(formatDiscountFold(0)).toBeNull()
  })
})

describe('formatDiscountPercent', () => {
  it('converts a real ratio into a percent-off number', () => {
    expect(formatDiscountPercent(0.1)).toBe(90)
    expect(formatDiscountPercent(0.08)).toBe(92)
    expect(formatDiscountPercent(1)).toBeNull()
    expect(formatDiscountPercent(0)).toBeNull()
  })
})

describe('getSiteDiscountFold', () => {
  it('returns a fold only when the displayed group ratio is below list', () => {
    expect(getSiteDiscountFold(model())).toBeNull()
    expect(
      getSiteDiscountFold(
        model({
          enable_groups: ['vip'],
          group_ratio: { vip: 0.08 },
        })
      )
    ).toBe('0.8')
  })

  it('does not invent a fold from unrelated group_ratio keys', () => {
    const mismatched = model({
      enable_groups: ['openai'],
      group_ratio: { default: 0.08, vip: 0.1 },
    })
    expect(getDisplayGroupRatio(mismatched)).toBe(1)
    expect(getDisplayGroupRatio(mismatched, 'default')).toBe(1)
    expect(getSiteDiscountFold(mismatched)).toBeNull()
    expect(getSiteDiscountFold(mismatched, 'default')).toBeNull()
  })

  it('uses a group ratio only when the model is enabled for that billing group', () => {
    const vipOnly = model({
      enable_groups: ['vip'],
      group_ratio: { default: 0.5, vip: 0.08 },
    })
    expect(getDisplayGroupRatio(vipOnly, 'vip')).toBe(0.08)
    expect(getDisplayGroupRatio(vipOnly, 'default')).toBe(1)
    expect(getSiteDiscountFold(vipOnly, 'vip')).toBe('0.8')
    expect(getSiteDiscountFold(vipOnly, 'default')).toBeNull()
    expect(
      getDisplayGroupRatio(
        model({
          enable_groups: ['all'],
          group_ratio: { default: 0.2, vip: 0.08 },
        })
      )
    ).toBe(0.08)
    expect(
      getDisplayGroupRatio(
        model({
          enable_groups: ['all'],
          group_ratio: { default: 0.2, vip: 0.08 },
        }),
        'default'
      )
    ).toBe(0.2)
  })

  it('shows a fold when the effective model ratio is below the configured base ratio', () => {
    expect(
      getSiteDiscountFold(
        model({
          model_ratio: 0.1,
          base_model_ratio: 1.25,
          enable_groups: ['default'],
          group_ratio: { default: 1 },
        })
      )
    ).toBe('0.8')
  })
})

describe('getMaxSiteDiscountFold', () => {
  it('returns the lowest real fold across models', () => {
    expect(getMaxSiteDiscountFold([model()])).toBeNull()
    expect(
      getMaxSiteDiscountFold([
        model({
          id: 1,
          enable_groups: ['vip'],
          group_ratio: { vip: 0.5 },
        }),
        model({
          id: 2,
          model_name: 'cheaper',
          enable_groups: ['vip'],
          group_ratio: { vip: 0.08 },
        }),
      ])
    ).toBe('0.8')
  })

  it('ignores folds from models that are not enabled for the selected group', () => {
    expect(
      getMaxSiteDiscountFold(
        [
          model({
            id: 1,
            enable_groups: ['openai'],
            group_ratio: { default: 0.08 },
          }),
          model({
            id: 2,
            model_name: 'in-group',
            enable_groups: ['default'],
            group_ratio: { default: 0.5 },
          }),
        ],
        'default'
      )
    ).toBe('5')
  })
})

describe('formatListPrice versus site price', () => {
  it('uses the configured base ratio for list when the model ratio is discounted', () => {
    const discounted = model({
      model_ratio: 0.125,
      base_model_ratio: 1.25,
      enable_groups: ['default'],
      group_ratio: { default: 1 },
    })
    expect(stripTrailingZeros(formatListPrice(discounted, 'input', 'M'))).toBe(
      '$2.5'
    )
    expect(stripTrailingZeros(formatPrice(discounted, 'input', 'M'))).toBe(
      '$0.25'
    )
  })
})

describe('sortVendorsForPricingPills', () => {
  it('places Teamo-order vendors first and keeps unknown names after them', () => {
    const sorted = sortVendorsForPricingPills([
      { id: 9, name: 'Other' },
      { id: 4, name: 'DeepSeek' },
      { id: 1, name: 'OpenAI' },
      { id: 7, name: 'Grok' },
      { id: 2, name: 'Anthropic' },
    ])
    expect(sorted.map((vendor) => vendor.name)).toEqual([
      'OpenAI',
      'Anthropic',
      'DeepSeek',
      'Grok',
      'Other',
    ])
  })
})

describe('getMaxSiteDiscountPercent', () => {
  it('returns null when every model is full price', () => {
    expect(getMaxSiteDiscountPercent([model()])).toBeNull()
  })

  it('returns the largest real group discount', () => {
    expect(
      getMaxSiteDiscountPercent([
        model({
          id: 1,
          enable_groups: ['vip'],
          group_ratio: { vip: 0.5 },
        }),
        model({
          id: 2,
          model_name: 'cheaper',
          enable_groups: ['vip'],
          group_ratio: { vip: 0.1 },
        }),
      ])
    ).toBe(90)
  })

  it('ignores discounts from models that are not enabled for the selected group', () => {
    expect(
      getMaxSiteDiscountPercent(
        [
          model({
            id: 1,
            enable_groups: ['openai'],
            group_ratio: { default: 0.1 },
          }),
          model({
            id: 2,
            model_name: 'in-group',
            enable_groups: ['default'],
            group_ratio: { default: 0.5 },
          }),
        ],
        'default'
      )
    ).toBe(50)
  })
})

describe('pickFeaturedModels', () => {
  it('skips request-priced models and prefers discounted vendors first', () => {
    const openaiCheap = model({
      id: 1,
      model_name: 'gpt-cheap',
      vendor_name: 'OpenAI',
      enable_groups: ['vip'],
      group_ratio: { vip: 0.1 },
    })
    const openaiFull = model({
      id: 2,
      model_name: 'gpt-full',
      vendor_name: 'OpenAI',
      enable_groups: ['default'],
      group_ratio: { default: 1 },
    })
    const anthropicCheap = model({
      id: 3,
      model_name: 'claude-cheap',
      vendor_name: 'Anthropic',
      enable_groups: ['vip'],
      group_ratio: { vip: 0.2 },
    })
    const perRequest = model({
      id: 4,
      model_name: 'image-1',
      vendor_name: 'OpenAI',
      quota_type: 1,
      enable_groups: ['vip'],
      group_ratio: { vip: 0.1 },
    })

    const picked = pickFeaturedModels(
      [openaiFull, perRequest, openaiCheap, anthropicCheap],
      { limit: 3 }
    )
    expect(picked.map((item) => item.model_name)).toEqual([
      'gpt-cheap',
      'claude-cheap',
      'gpt-full',
    ])
  })

  it('fills remaining slots with other token models when discounts are scarce', () => {
    const picked = pickFeaturedModels(
      [
        model({
          id: 1,
          model_name: 'only-deal',
          vendor_name: 'OpenAI',
          enable_groups: ['vip'],
          group_ratio: { vip: 0.1 },
        }),
        model({
          id: 2,
          model_name: 'full-a',
          vendor_name: 'Anthropic',
        }),
        model({
          id: 3,
          model_name: 'full-b',
          vendor_name: 'Google',
        }),
      ],
      { limit: 3 }
    )
    expect(picked.map((item) => item.model_name)).toEqual([
      'only-deal',
      'full-a',
      'full-b',
    ])
  })

  it('does not feature a model that is not enabled for the selected group', () => {
    const picked = pickFeaturedModels(
      [
        model({
          id: 1,
          model_name: 'other-group',
          vendor_name: 'OpenAI',
          enable_groups: ['openai'],
          group_ratio: { default: 0.1 },
        }),
        model({
          id: 2,
          model_name: 'in-group',
          vendor_name: 'Anthropic',
          enable_groups: ['default'],
          group_ratio: { default: 0.5 },
        }),
      ],
      { selectedGroup: 'default', limit: 3 }
    )
    expect(picked.map((item) => item.model_name)).toEqual(['in-group'])
  })
})

describe('getContextLengthTiers', () => {
  const lengthExpr =
    'len <= 272000 ? tier("short", p * 1.92 + c * 7.2) : tier("long", p * 3.84 + c * 10.8)'

  it('returns parsed length tiers only when the model has a real len expression', () => {
    const tiers = getContextLengthTiers(
      model({
        billing_mode: 'tiered_expr',
        billing_expr: lengthExpr,
      })
    )
    expect(tiers).toHaveLength(2)
    expect(
      formatContextLengthCondition(tiers[0].conditions, tiers[0].label)
    ).toBe('≤ 272K')
    expect(
      formatContextLengthCondition(
        tiers[1].conditions,
        getComplementContextLengthLabel(tiers) || tiers[1].label
      )
    ).toBe('> 272K')
  })

  it('omits a tooltip source when billing is not length-tiered', () => {
    expect(
      getContextLengthTiers(
        model({
          billing_mode: 'tiered_expr',
          billing_expr: 'tier("base", p * 2 + c * 8)',
        })
      )
    ).toEqual([])
    expect(getContextLengthTiers(model())).toEqual([])
  })
})
