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
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import {
  AnnouncementBar,
  BrandMark,
  resolveMarketingSiteName,
  StatsStrip,
} from '..'

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
})

describe('BrandMark', () => {
  it('renders the Chuyi character mark', () => {
    render(<BrandMark />)
    expect(screen.getByText('初')).toBeVisible()
  })
})

describe('resolveMarketingSiteName', () => {
  it('falls back to Chuyi API when the backend still uses the default New API name', () => {
    expect(
      resolveMarketingSiteName({
        systemName: 'New API',
        fallback: 'Chuyi API',
      })
    ).toBe('Chuyi API')
  })

  it('keeps an administrator-configured system name', () => {
    expect(
      resolveMarketingSiteName({
        systemName: 'Acme Gateway',
        fallback: 'Chuyi API',
      })
    ).toBe('Acme Gateway')
  })

  it('prefers an explicit custom name over the system name', () => {
    expect(
      resolveMarketingSiteName({
        customName: 'Override',
        systemName: 'Acme Gateway',
        fallback: 'Chuyi API',
      })
    ).toBe('Override')
  })
})

describe('StatsStrip', () => {
  it('renders the default marketing metrics', () => {
    render(<StatsStrip />)
    expect(screen.getByText('Tokens routed yesterday')).toBeVisible()
    expect(screen.getByText('30-day availability')).toBeVisible()
  })
})

describe('AnnouncementBar', () => {
  it('can be dismissed and stays dismissed for the session', async () => {
    const user = userEvent.setup()
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <AnnouncementBar />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    const first = render(<RouterProvider router={router} />)

    expect(
      screen.getByText('Official models are live — up to 92% off list price')
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' })
    )
    expect(
      screen.queryByText('Official models are live — up to 92% off list price')
    ).not.toBeInTheDocument()
    first.unmount()

    const secondRouter = createRouter({
      routeTree: createRootRoute({
        component: () => <AnnouncementBar />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await secondRouter.load()
    render(<RouterProvider router={secondRouter} />)
    expect(
      screen.queryByText('Official models are live — up to 92% off list price')
    ).not.toBeInTheDocument()
  })
})
