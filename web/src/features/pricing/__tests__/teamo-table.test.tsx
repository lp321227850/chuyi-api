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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { TeamoPricingTable } from '../components/teamo-pricing-table'
import { buildGroupPerformance } from '../lib/mock-stats'
import { TEAMO_TABLE_PREVIEW_COUNT } from '../lib/teamo-display'
import type { PricingModel } from '../types'

afterEach(() => {
  cleanup()
})

function model(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'model-1',
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    enable_groups: ['vip'],
    group_ratio: { vip: 0.1 },
    context_length: 200_000,
    ...overrides,
  }
}

function renderTable(
  models: PricingModel[],
  successRates: Record<string, number> = {},
  recentSuccessRates?: Record<string, number[]>
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TeamoPricingTable
        models={models}
        successRates={successRates}
        recentSuccessRates={recentSuccessRates}
      />
    </QueryClientProvider>
  )
}

describe('TeamoPricingTable', () => {
  it('highlights Chuyi price columns and can expand beyond the preview', async () => {
    const user = userEvent.setup()
    const models = Array.from(
      { length: TEAMO_TABLE_PREVIEW_COUNT + 2 },
      (_, i) =>
        model({
          id: i + 1,
          model_name: `model-${i + 1}`,
        })
    )
    renderTable(models)

    expect(screen.getByText('Input (Chuyi)')).toBeVisible()
    expect(screen.getByText('Output (Chuyi)')).toBeVisible()
    expect(screen.getByText('Uptime (SLA)')).toBeVisible()
    expect(screen.getByText('model-1')).toBeVisible()
    expect(
      screen.queryByText(`model-${TEAMO_TABLE_PREVIEW_COUNT + 1}`)
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show more' }))
    expect(
      screen.getByText(`model-${TEAMO_TABLE_PREVIEW_COUNT + 1}`)
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Show less' })).toBeVisible()
  })

  it('shows an honest placeholder instead of generated mock uptime', () => {
    const sample = model()
    const fakeUptime = buildGroupPerformance(sample)[0]?.uptime_30d_pct
    renderTable([sample], {})

    expect(screen.getByText('Uptime (SLA)')).toBeVisible()
    expect(screen.getByText('—')).toBeVisible()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument()
    if (fakeUptime != null) {
      expect(
        screen.queryByText(`${fakeUptime.toFixed(2)}%`)
      ).not.toBeInTheDocument()
    }
  })

  it('renders a real 24h success rate when the summary API supplies one', () => {
    renderTable([model()], { 'model-1': 97.5 })

    expect(screen.getByText('97.50%')).toBeVisible()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('draws one health segment per real recent success sample', () => {
    renderTable([model()], { 'model-1': 97.5 }, { 'model-1': [90, 97.5, 100] })

    const sparkline = screen.getByRole('img', {
      name: 'Recent success-rate samples',
    })
    expect(sparkline).toBeVisible()
    expect(sparkline.querySelectorAll('[aria-hidden]')).toHaveLength(3)
  })

  it('uses list cache for the list column and site cache for Chuyi', () => {
    renderTable([
      model({
        cache_ratio: 0.1,
      }),
    ])

    const row = screen.getByText('model-1').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('Cache $0.2')).toBeVisible()
    expect(within(row as HTMLElement).getByText('Cache $0.02')).toBeVisible()
  })

  it('omits a cache line and invented tier tip when those configs are absent', () => {
    renderTable([model({ cache_ratio: null })])

    expect(screen.queryByText(/Cache/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Context-tiered pricing' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Tiered pricing may apply')).not.toBeInTheDocument()
  })

  it('shows a context-tier trigger only when a real len expression exists', () => {
    renderTable([
      model({
        billing_mode: 'tiered_expr',
        billing_expr:
          'len <= 272000 ? tier("short", p * 1.92 + c * 7.2) : tier("long", p * 3.84 + c * 10.8)',
      }),
    ])

    expect(
      screen.getByRole('button', { name: 'Context-tiered pricing' })
    ).toBeVisible()
  })

  it('shows a discount badge only when the group ratio is below list', () => {
    renderTable([
      model({
        model_name: 'full-price',
        enable_groups: ['default'],
        group_ratio: { default: 1 },
      }),
    ])
    expect(screen.queryByText('90% off')).not.toBeInTheDocument()

    cleanup()
    renderTable([model({ model_name: 'sale-price' })])
    expect(screen.getAllByText('90% off').length).toBeGreaterThan(0)
  })
})
