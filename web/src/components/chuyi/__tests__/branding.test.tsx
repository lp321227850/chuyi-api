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
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

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
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  it('renders provided live metrics without vanity placeholders', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StatsStrip
          items={[
            { value: '99.22%', label: '24h request success rate' },
            { value: '1280', label: 'Requests in the last 24 hours' },
          ]}
        />
      </QueryClientProvider>
    )
    expect(screen.getByText('99.22%')).toBeVisible()
    expect(screen.getByText('24h request success rate')).toBeVisible()
    expect(screen.getByText('1280')).toBeVisible()
    expect(screen.queryByText('796B+')).not.toBeInTheDocument()
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument()
    expect(screen.queryByText('Tokens routed yesterday')).not.toBeInTheDocument()
    expect(screen.queryByText('30-day availability')).not.toBeInTheDocument()
  })

  it('shows an honest empty state when no live aggregates exist', async () => {
    vi.spyOn(api, 'get').mockImplementation(((url: string) => {
      if (url === '/api/perf-metrics/summary') {
        return Promise.resolve({
          data: { success: true, data: { models: [], total_requests: 0 } },
        })
      }
      if (url === '/api/uptime/status') {
        return Promise.resolve({ data: { success: true, data: [] } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    }) as typeof api.get)

    render(
      <QueryClientProvider client={queryClient}>
        <StatsStrip />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('No stats yet')).toBeVisible()
    })
    expect(
      screen.getByText('Live success rate appears after requests are recorded.')
    ).toBeVisible()
    expect(screen.queryByText('796B+')).not.toBeInTheDocument()
    expect(screen.queryByText('>99%')).not.toBeInTheDocument()
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument()
    expect(screen.queryByText('Tokens routed yesterday')).not.toBeInTheDocument()
    expect(screen.queryByText('Prompt cache hit rate')).not.toBeInTheDocument()
    expect(screen.queryByText('30-day availability')).not.toBeInTheDocument()
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
