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
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicLayout } from '../components/public-layout'

vi.mock('../components/public-header', () => ({
  PublicHeader: () => <header data-testid='public-header' />,
}))

afterEach(() => {
  cleanup()
})

describe('PublicLayout', () => {
  it('does not clip overflow so pricing table headers can stick below the nav', () => {
    const { container } = render(
      <PublicLayout showMainContainer={false}>
        <div>pricing</div>
      </PublicLayout>
    )
    const root = container.querySelector('[data-chuyi-theme]')
    expect(root).not.toBeNull()
    expect(root?.className).toMatch(/max-lg:overflow-x-clip/)
    expect(root?.className).not.toMatch(/(^|\s)overflow-x-clip/)
    expect(root?.className).not.toMatch(/overflow-hidden/)
  })
})
