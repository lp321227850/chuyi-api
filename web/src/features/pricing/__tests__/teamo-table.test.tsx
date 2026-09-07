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
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { TeamoPricingTable } from '../components/teamo-pricing-table'
import { buildGroupPerformance } from '../lib/mock-stats'
import { TEAMO_TABLE_PREVIEW_COUNT } from '../lib/teamo-display'
import type { PricingModel } from '../types'

afterEach(() => {
  cleanup()
})

function model(index: number): PricingModel {
  return {
    id: index,
    model_name: `model-${index}`,
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    enable_groups: ['vip'],
    group_ratio: { vip: 0.1 },
    context_length: 200_000,
  }
}

function renderTable(
  models: PricingModel[],
  successRates: Record<string, number> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TeamoPricingTable models={models} successRates={successRates} />
    </QueryClientProvider>
  )
}

describe('TeamoPricingTable', () => {
  it('highlights Chuyi price columns and can expand beyond the preview', async () => {
    const user = userEvent.setup()
    const models = Array.from(
      { length: TEAMO_TABLE_PREVIEW_COUNT + 2 },
      (_, i) => model(i + 1)
    )
    renderTable(models)

    expect(screen.getByText('Input (Chuyi)')).toBeVisible()
    expect(screen.getByText('Output (Chuyi)')).toBeVisible()
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
    const sample = model(1)
    const fakeUptime = buildGroupPerformance(sample)[0]?.uptime_30d_pct
    renderTable([sample], {})

    expect(screen.getByText('Success rate')).toBeVisible()
    expect(screen.getByText('—')).toBeVisible()
    if (fakeUptime != null) {
      expect(
        screen.queryByText(`${fakeUptime.toFixed(2)}%`)
      ).not.toBeInTheDocument()
    }
  })

  it('renders a real 24h success rate when the summary API supplies one', () => {
    renderTable([model(1)], { 'model-1': 97.5 })

    expect(screen.getByText('97.50%')).toBeVisible()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
