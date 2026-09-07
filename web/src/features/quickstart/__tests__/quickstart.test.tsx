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
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { Quickstart } from '..'
import { buildQuickstartSnippet } from '../lib/snippets'

afterEach(() => {
  cleanup()
})

describe('buildQuickstartSnippet', () => {
  const context = {
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-4o-mini',
    apiKey: 'sk-test',
  }

  it('emits Claude Code env exports when that client is selected', () => {
    const snippet = buildQuickstartSnippet('claude-code', 'python', context)
    expect(snippet).toContain('ANTHROPIC_BASE_URL="https://api.example.com/v1"')
    expect(snippet).toContain('ANTHROPIC_AUTH_TOKEN="sk-test"')
  })

  it('emits an OpenAI-compatible Python snippet on the API tab', () => {
    const snippet = buildQuickstartSnippet('api', 'python', context)
    expect(snippet).toContain('base_url = "https://api.example.com/v1"')
    expect(snippet).toContain('api_key = "sk-test"')
  })
})

describe('Quickstart page', () => {
  it('switches the visible snippet when a client tab is selected', async () => {
    const user = userEvent.setup()
    const router = createRouter({
      routeTree: createRootRoute({ component: Quickstart }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    expect(screen.getByRole('heading', { name: 'Quick Start' })).toBeVisible()
    expect(screen.getByText('Get an API key')).toBeVisible()
    expect(
      screen.queryByText('Download desktop config tool')
    ).not.toBeInTheDocument()
    expect(screen.getByText(/ANTHROPIC_BASE_URL/)).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'API' }))
    expect(screen.getByRole('button', { name: 'Python' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText(/from openai import OpenAI/)).toBeVisible()
  })
})
