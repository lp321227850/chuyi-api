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
import type { UptimeGroupResult } from '@/features/dashboard/types'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import type { PerfSummaryAllData } from '@/features/performance-metrics/types'
import { api } from '@/lib/api'
import { formatNumber, formatPercent } from '@/lib/format'

export type PublicStatItem = {
  value: string
  label: string
}

export type PublicRelaySummary = {
  total_requests?: number
  success_rate?: number
}

export type PublicStatLabels = {
  successRate: string
  requests: string
  monitorAvailability: string
}

const silentPublicGet = {
  skipErrorHandler: true,
  skipAuthRefresh: true,
  skipBusinessError: true,
}

export function monitorAvailabilityPct(uptime: number): number | null {
  if (!Number.isFinite(uptime) || uptime <= 0) return null
  const pct = uptime <= 1 ? uptime * 100 : uptime
  if (pct > 100) return null
  return pct
}

export function collectMonitorUptimes(
  groups: UptimeGroupResult[] | null | undefined
): number[] {
  const rates: number[] = []
  for (const group of groups ?? []) {
    for (const monitor of group.monitors ?? []) {
      const pct = monitorAvailabilityPct(monitor.uptime)
      if (pct != null) rates.push(pct)
    }
  }
  return rates
}

export function buildPublicStatItems(input: {
  summary?: PublicRelaySummary | null
  monitors?: UptimeGroupResult[] | null
  formatNumber: (value: number) => string
  formatPercent: (value: number) => string
  labels: PublicStatLabels
}): PublicStatItem[] {
  const items: PublicStatItem[] = []
  const totalRequests = input.summary?.total_requests ?? 0
  const successRate = input.summary?.success_rate
  const hasSuccessRate =
    totalRequests > 0 &&
    successRate != null &&
    Number.isFinite(successRate) &&
    successRate >= 0 &&
    successRate <= 100

  if (hasSuccessRate) {
    items.push({
      value: input.formatPercent(successRate),
      label: input.labels.successRate,
    })
    items.push({
      value: input.formatNumber(totalRequests),
      label: input.labels.requests,
    })
  }

  const monitorRates = collectMonitorUptimes(input.monitors)
  if (monitorRates.length > 0) {
    items.push({
      value: input.formatPercent(Math.min(...monitorRates)),
      label: input.labels.monitorAvailability,
    })
  }

  return items
}

export async function fetchPublicPerfSummary(): Promise<PerfSummaryAllData> {
  return getPerfMetricsSummary(24, silentPublicGet)
}

export async function fetchPublicUptimeStatus(): Promise<{
  success: boolean
  data?: UptimeGroupResult[]
}> {
  const res = await api.get<{ success: boolean; data: UptimeGroupResult[] }>(
    '/api/uptime/status',
    silentPublicGet
  )
  return res.data
}

export function formatPublicStatNumber(value: number): string {
  return formatNumber(value)
}

export function formatPublicStatPercent(value: number): string {
  return formatPercent(value)
}
