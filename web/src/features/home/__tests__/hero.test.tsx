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
import { afterEach, describe, expect, it } from 'vitest'

import { Hero } from '../components/sections/hero'

afterEach(() => {
  cleanup()
})

describe('Hero', () => {
  it('routes the secondary CTA to quickstart without promising a desktop download', async () => {
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <Hero />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(<RouterProvider router={router} />)

    const setup = screen.getByRole('button', { name: 'Quick setup' })
    expect(setup).toBeVisible()
    expect(setup).toHaveAttribute('href', '/quickstart')
    expect(screen.queryByText('Download desktop app')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get API Key' })).toBeVisible()
    expect(screen.getByText('Official models are live')).toBeVisible()
    expect(screen.queryByText('Official models · up to 90% off')).not.toBeInTheDocument()
    expect(screen.queryByText('90% off')).not.toBeInTheDocument()
  })
})
