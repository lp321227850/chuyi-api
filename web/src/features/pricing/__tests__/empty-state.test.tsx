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

import { EmptyState } from '../components/empty-state'

afterEach(() => {
  cleanup()
})

describe('EmptyState', () => {
  it('does not treat a catalog load failure as an empty filter result', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<EmptyState variant='error' onRetry={onRetry} />)

    expect(screen.getByText('Failed to load model pricing')).toBeVisible()
    expect(screen.getByText('Please try again later.')).toBeVisible()
    expect(
      screen.queryByText('No models match your current filters.')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('No models are published in the catalog yet.')
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('uses catalog-empty copy when the backend returned no models', () => {
    render(<EmptyState variant='catalog' />)

    expect(screen.getByText('No models available')).toBeVisible()
    expect(
      screen.getByText('No models are published in the catalog yet.')
    ).toBeVisible()
    expect(
      screen.queryByText('No models match your current filters.')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear all filters' })
    ).not.toBeInTheDocument()
  })

  it('keeps filter-empty copy when the user narrowed a loaded catalog', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    render(
      <EmptyState
        hasActiveFilters
        onClearFilters={onClearFilters}
        searchQuery='gpt-missing'
      />
    )

    expect(screen.getByText('No models found')).toBeVisible()
    expect(
      screen.getByText(
        'No results for "gpt-missing". Try adjusting your search or filters.'
      )
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })
})
