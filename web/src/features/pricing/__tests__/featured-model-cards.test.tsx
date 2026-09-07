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
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FeaturedModelCards } from '../components/featured-model-cards'
import type { PricingModel } from '../types'

afterEach(() => {
  cleanup()
})

function model(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'gpt-featured',
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    enable_groups: ['vip'],
    group_ratio: { vip: 0.1 },
    context_length: 1_000_000,
    ...overrides,
  }
}

describe('FeaturedModelCards', () => {
  it('shows an honest empty state instead of invented featured prices', () => {
    render(<FeaturedModelCards models={[]} />)
    expect(screen.getByText('No stats yet')).toBeVisible()
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument()
    expect(screen.queryByText('1×')).not.toBeInTheDocument()
    expect(screen.queryByText('90% off')).not.toBeInTheDocument()
  })

  it('compares list and site input/output prices and opens the model on click', async () => {
    const user = userEvent.setup()
    const onModelClick = vi.fn()
    render(
      <FeaturedModelCards models={[model()]} onModelClick={onModelClick} />
    )

    expect(screen.getByText('gpt-featured')).toBeVisible()
    expect(screen.getByText('OpenAI')).toBeVisible()
    expect(screen.getByText('Input / 1M tokens')).toBeVisible()
    expect(screen.getByText('Output / 1M tokens')).toBeVisible()
    expect(screen.getByText('$2')).toBeVisible()
    expect(screen.getByText('$0.2')).toBeVisible()
    expect(screen.getByText('$4')).toBeVisible()
    expect(screen.getByText('$0.4')).toBeVisible()
    expect(screen.getAllByText('90% off').length).toBeGreaterThan(0)
    expect(screen.queryByText('1×')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /gpt-featured/ }))
    expect(onModelClick).toHaveBeenCalledWith('gpt-featured')
  })
})
