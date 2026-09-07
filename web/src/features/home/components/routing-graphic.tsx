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
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/chuyi'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  { name: 'Claude', icon: 'Claude.Color' },
  { name: 'GPT', icon: 'OpenAI' },
  { name: 'Gemini', icon: 'Gemini.Color' },
  { name: 'DeepSeek', icon: 'DeepSeek.Color' },
] as const

const CLIENTS = [
  { name: 'Claude Code', icon: 'Claude.Color' },
  { name: 'Codex', icon: 'OpenAI' },
  { name: 'Cursor', icon: 'Cursor' },
  { name: 'OpenAI SDK', icon: 'OpenAI' },
] as const

function NodeCard(props: { name: string; icon: string }) {
  return (
    <div className='flex items-center gap-2.5 rounded-xl border border-[var(--chuyi-line,#e6e0d6)] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(20_20_20/0.04)]'>
      <span className='flex size-7 items-center justify-center'>
        {getLobeIcon(props.icon, 18) ?? (
          <span className='text-muted-foreground text-[10px] font-semibold'>
            {props.name.slice(0, 1)}
          </span>
        )}
      </span>
      <span className='text-sm font-medium'>{props.name}</span>
    </div>
  )
}

export function RoutingGraphic(props: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'relative mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr]',
        props.className
      )}
    >
      <div>
        <p className='text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase'>
          <span aria-hidden='true'>● </span>
          {t('Model providers')}
        </p>
        <div className='grid gap-2.5'>
          {PROVIDERS.map((provider) => (
            <NodeCard
              key={provider.name}
              name={provider.name}
              icon={provider.icon}
            />
          ))}
        </div>
      </div>

      <div
        className='relative hidden h-full min-h-64 w-40 md:block'
        aria-hidden
      >
        <svg
          className='absolute inset-0 h-full w-full'
          viewBox='0 0 160 280'
          fill='none'
        >
          <path
            d='M8 36 C70 36, 70 140, 80 140'
            stroke='#ffd2b0'
            strokeWidth='1.2'
          />
          <path
            d='M8 100 C70 100, 70 140, 80 140'
            stroke='#c8e8ee'
            strokeWidth='1.2'
          />
          <path
            d='M8 164 C70 164, 70 140, 80 140'
            stroke='#ffd2b0'
            strokeWidth='1.2'
          />
          <path
            d='M8 228 C70 228, 70 140, 80 140'
            stroke='#c8e8ee'
            strokeWidth='1.2'
          />
          <path
            d='M80 140 C90 140, 90 36, 152 36'
            stroke='#ffd2b0'
            strokeWidth='1.2'
          />
          <path
            d='M80 140 C90 140, 90 100, 152 100'
            stroke='#c8e8ee'
            strokeWidth='1.2'
          />
          <path
            d='M80 140 C90 140, 90 164, 152 164'
            stroke='#ffd2b0'
            strokeWidth='1.2'
          />
          <path
            d='M80 140 C90 140, 90 228, 152 228'
            stroke='#c8e8ee'
            strokeWidth='1.2'
          />
          <circle
            className='chuyi-flow-dot'
            r='3'
            fill='#ff6a00'
            style={{
              offsetPath: "path('M8 36 C70 36, 70 140, 80 140')",
              animation: 'chuyi-dot-flow 3.6s linear infinite',
            }}
          />
          <circle
            className='chuyi-flow-dot'
            r='3'
            fill='#5cb8c9'
            style={{
              offsetPath: "path('M80 140 C90 140, 90 100, 152 100')",
              animation: 'chuyi-dot-flow 3.2s linear 0.6s infinite',
            }}
          />
        </svg>
        <div className='absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--chuyi-line,#e6e0d6)] bg-white shadow-sm'>
          <BrandMark size='md' />
        </div>
      </div>

      <div className='flex flex-col items-center md:hidden' aria-hidden>
        <BrandMark size='lg' />
      </div>

      <div>
        <p className='text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase'>
          <span aria-hidden='true'>● </span>
          {t('Coding agents & clients')}
        </p>
        <div className='grid gap-2.5'>
          {CLIENTS.map((client) => (
            <NodeCard key={client.name} name={client.name} icon={client.icon} />
          ))}
        </div>
      </div>
    </div>
  )
}
