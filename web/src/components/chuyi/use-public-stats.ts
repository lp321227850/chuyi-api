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
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  buildPublicStatItems,
  fetchPublicPerfSummary,
  fetchPublicUptimeStatus,
  formatPublicStatNumber,
  formatPublicStatPercent,
  type PublicStatItem,
} from './public-stats'

export function usePublicStats(options?: { enabled?: boolean }): {
  items: PublicStatItem[]
  isLoading: boolean
} {
  const { t } = useTranslation()
  const enabled = options?.enabled ?? true

  const summaryQuery = useQuery({
    queryKey: ['perf-metrics-summary', 24],
    queryFn: fetchPublicPerfSummary,
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  })

  const uptimeQuery = useQuery({
    queryKey: ['uptime-status'],
    queryFn: fetchPublicUptimeStatus,
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  })

  const items = useMemo(
    () =>
      buildPublicStatItems({
        summary: summaryQuery.data?.data,
        monitors: uptimeQuery.data?.data,
        formatNumber: formatPublicStatNumber,
        formatPercent: formatPublicStatPercent,
        labels: {
          successRate: t('24h request success rate'),
          requests: t('Requests in the last 24 hours'),
          monitorAvailability: t('24h monitor availability'),
        },
      }),
    [summaryQuery.data?.data, t, uptimeQuery.data?.data]
  )

  return {
    items,
    isLoading: enabled && (summaryQuery.isLoading || uptimeQuery.isLoading),
  }
}
