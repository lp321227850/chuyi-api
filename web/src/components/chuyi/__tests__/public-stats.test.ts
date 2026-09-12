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

import { buildPublicStatItems } from '../public-stats'

const labels = {
  successRate: '24h request success rate',
  requests: 'Requests in the last 24 hours',
  monitorAvailability: '24h monitor availability',
}

describe('buildPublicStatItems', () => {
  it('omits every metric when the backend has no request volume', () => {
    expect(
      buildPublicStatItems({
        summary: { total_requests: 0, success_rate: 99.98 },
        monitors: [],
        formatNumber: String,
        formatPercent: (value) => `${value}%`,
        labels,
      })
    ).toEqual([])
  })

  it('does not invent a site-wide rate from per-model averages', () => {
    expect(
      buildPublicStatItems({
        summary: { success_rate: 99.22 },
        monitors: [],
        formatNumber: String,
        formatPercent: (value) => `${value}%`,
        labels,
      })
    ).toEqual([])
  })

  it('publishes weighted 24h success and request volume when totals exist', () => {
    expect(
      buildPublicStatItems({
        summary: { total_requests: 1280, success_rate: 99.22 },
        monitors: [],
        formatNumber: String,
        formatPercent: (value) => `${value.toFixed(2)}%`,
        labels,
      })
    ).toEqual([
      { value: '99.22%', label: '24h request success rate' },
      { value: '1280', label: 'Requests in the last 24 hours' },
    ])
  })

  it('adds conservative 24h monitor availability only when Uptime Kuma reports it', () => {
    expect(
      buildPublicStatItems({
        summary: { total_requests: 10, success_rate: 100 },
        monitors: [
          {
            categoryName: 'api',
            monitors: [
              { name: 'edge', uptime: 0.9987, status: 1 },
              { name: 'core', uptime: 0.991, status: 1 },
            ],
          },
        ],
        formatNumber: String,
        formatPercent: (value) => `${value.toFixed(2)}%`,
        labels,
      })
    ).toEqual([
      { value: '100.00%', label: '24h request success rate' },
      { value: '10', label: 'Requests in the last 24 hours' },
      { value: '99.10%', label: '24h monitor availability' },
    ])
  })
})
