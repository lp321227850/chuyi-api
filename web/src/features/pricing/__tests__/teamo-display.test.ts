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

import { getSiteDiscountPercent } from '../lib/price'
import {
  formatContextLengthCondition,
  formatContextWindow,
  getComplementContextLengthLabel,
  getContextLengthTiers,
  getMaxSiteDiscountPercent,
  hasCachePrice,
  pickFeaturedModels,
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
