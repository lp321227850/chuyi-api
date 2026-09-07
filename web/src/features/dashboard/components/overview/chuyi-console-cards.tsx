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
import { Link } from '@tanstack/react-router'
import { Command, Diamond, Sparkle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { formatNumber, formatQuota } from '@/lib/format'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

function formatDisplayKey(key?: string): string {
  if (!key) return 'sk-...'
  const value = key.startsWith('sk-') ? key : `sk-${key}`
  if (value.length <= 14) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function ChuyiConsoleCards() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const requestCount = Number(user?.request_count ?? 0)
  const summaryTimeRange = useMemo(() => computeTimeRange(1), [])

  const usageQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'summary-sparklines',
      summaryTimeRange.start_timestamp,
      summaryTimeRange.end_timestamp,
    ],
    queryFn: async () =>
      getUserQuotaDates({
        start_timestamp: summaryTimeRange.start_timestamp,
        end_timestamp: summaryTimeRange.end_timestamp,
        default_time: 'hour',
      }),
    staleTime: 60 * 1000,
  })

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 10 })
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const recentUsage = useMemo(
    () =>
      (usageQuery.data?.data ?? []).reduce(
        (total, item) => total + (Number(item.quota) || 0),
        0
      ),
    [usageQuery.data?.data]
  )
  const keys = apiKeysQuery.data ?? []
  const enabledKeys = keys.filter((item) => item.status === 1)
  const previewKeys = keys.slice(0, 2)
  const runwayDays =
    remainQuota > 0 && recentUsage > 0 ? remainQuota / recentUsage : null

  return (
    <div data-chuyi-theme='' className='flex flex-col gap-4'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <article className='chuyi-lift rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='text-sm font-semibold'>{t('Account balance')}</h3>
            <span className='rounded-full bg-[var(--chuyi-peach,#fff1e4)] px-2 py-0.5 text-[10px] font-semibold text-[var(--chuyi-orange,#ff6a00)]'>
              {t('Live')}
            </span>
          </div>
          <p className='mt-3 text-2xl font-bold tracking-tight'>
            {formatQuota(remainQuota)}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('Used this month {{amount}} · estimated {{days}} days left', {
              amount: formatQuota(usedQuota),
              days:
                runwayDays === null
                  ? '—'
                  : formatNumber(Math.max(1, Math.floor(runwayDays))),
            })}
          </p>
          <div className='mt-4 flex flex-wrap gap-2'>
            <Button
              className='chuyi-press rounded-full bg-[var(--chuyi-ink,#141414)] text-white'
              render={<Link to='/wallet' />}
            >
              {t('Top up now')}
            </Button>
            <Button
              variant='outline'
              className='chuyi-press rounded-full bg-white'
              render={<Link to='/usage-logs' />}
            >
              {t('Billing details')}
            </Button>
          </div>
        </article>

        <article className='chuyi-lift rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'>
          <h3 className='text-sm font-semibold'>{t("Today's usage")}</h3>
          <p className='mt-3 text-2xl font-bold tracking-tight'>
            {formatQuota(recentUsage)}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('Token · {{count}} requests', {
              count: formatNumber(requestCount),
            })}
          </p>
          <div className='mt-4 space-y-2'>
            <UsageBar
              label={t('Usage')}
              value={formatQuota(recentUsage)}
              ratio={
                remainQuota > 0 ? recentUsage / (recentUsage + remainQuota) : 0
              }
            />
          </div>
        </article>

        <article className='chuyi-lift rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'>
          <h3 className='text-sm font-semibold'>{t('API keys shortcut')}</h3>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('{{total}} keys · {{active}} active', {
              total: keys.length,
              active: enabledKeys.length,
            })}
          </p>
          <div className='mt-3 space-y-2'>
            {previewKeys.length === 0 ? (
              <p className='text-muted-foreground text-xs'>
                {t('No API key yet')}
              </p>
            ) : (
              previewKeys.map((item) => (
                <KeyPreview key={item.id} item={item} />
              ))
            )}
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            <Button
              className='chuyi-press rounded-full bg-[var(--chuyi-ink,#141414)] text-white'
              render={<Link to='/keys' />}
            >
              {t('New Key')}
            </Button>
            <Button
              variant='outline'
              className='chuyi-press rounded-full bg-white'
              render={<Link to='/keys' />}
            >
              {t('Manage')}
            </Button>
          </div>
        </article>
      </div>

      <div>
        <h3 className='mb-3 text-sm font-semibold'>{t('Agent setup')}</h3>
        <div className='grid gap-3 md:grid-cols-3'>
          <AgentCard
            title='Claude Code'
            description={t('Export Anthropic Base URL and start Claude Code.')}
            client='claude-code'
            icon={<Command className='size-4' />}
          />
          <AgentCard
            title='Codex'
            description={t('Point Codex at the OpenAI-compatible Base URL.')}
            client='codex'
            icon={<Sparkle className='size-4' />}
          />
          <AgentCard
            title='Gemini / API'
            description={t('Use Gemini CLI or any official SDK.')}
            client='gemini'
            icon={<Diamond className='size-4' />}
          />
        </div>
      </div>
    </div>
  )
}

function UsageBar(props: { label: string; value: string; ratio: number }) {
  const width = `${Math.min(100, Math.max(6, props.ratio * 100))}%`
  return (
    <div>
      <div className='mb-1 flex justify-between text-[11px]'>
        <span className='text-muted-foreground'>{props.label}</span>
        <span className='tabular-nums'>{props.value}</span>
      </div>
      <div className='h-1.5 overflow-hidden rounded-full bg-[var(--chuyi-line,#e6e0d6)]'>
        <div
          className='h-full rounded-full bg-[var(--chuyi-orange,#ff6a00)]'
          style={{ width }}
        />
      </div>
    </div>
  )
}

function KeyPreview(props: { item: ApiKey }) {
  const { t } = useTranslation()
  const enabled = props.item.status === 1
  return (
    <div className='flex items-center justify-between gap-2 rounded-lg bg-[var(--chuyi-cream,#fffefb)] px-2.5 py-2'>
      <code className='font-mono text-xs'>
        {formatDisplayKey(props.item.key)}
      </code>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
          enabled
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {enabled ? t('Enabled') : t('Disabled')}
      </span>
    </div>
  )
}

function AgentCard(props: {
  title: string
  description: string
  client: 'claude-code' | 'codex' | 'gemini'
  icon: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <article className='chuyi-lift rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'>
      <div className='flex size-9 items-center justify-center rounded-lg bg-[var(--chuyi-peach,#fff1e4)] text-[var(--chuyi-orange,#ff6a00)]'>
        {props.icon}
      </div>
      <h4 className='mt-3 text-sm font-semibold'>{props.title}</h4>
      <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
        {props.description}
      </p>
      <Link
        to='/quickstart'
        search={{ client: props.client }}
        className='mt-3 inline-flex text-xs font-medium text-[var(--chuyi-orange,#ff6a00)]'
      >
        {t('View steps')} →
      </Link>
    </article>
  )
}
