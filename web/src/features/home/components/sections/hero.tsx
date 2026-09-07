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
import { Link } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { ApiEndpointPill } from '../api-endpoint-pill'
import { RoutingGraphic } from '../routing-graphic'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-28 pb-16 md:pt-32 md:pb-20'>
      <div
        aria-hidden
        className='chuyi-mesh pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] opacity-90'
      />

      <div className='mx-auto flex max-w-4xl flex-col items-center text-center'>
        <div className='chuyi-enter mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--chuyi-line,#e6e0d6)] bg-white/80 px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm'>
          <span className='size-1.5 rounded-full bg-emerald-500' aria-hidden />
          <span>{t('Official models · up to 90% off')}</span>
        </div>

        <h1 className='chuyi-enter chuyi-enter-delay-1 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.15] font-bold tracking-tight'>
          {t('LLM routing for production workloads')}
        </h1>
        <p className='text-muted-foreground chuyi-enter chuyi-enter-delay-2 mt-5 max-w-2xl text-base leading-relaxed md:text-[17px]'>
          {t(
            'One Base URL for official models and mainstream agents. Stable, observable, and better priced.'
          )}
        </p>

        <div className='chuyi-enter chuyi-enter-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3'>
          <div className='relative'>
            <span className='absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-[var(--chuyi-ink,#141414)] px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white'>
              {t('One-click setup')}
            </span>
            <Button
              className='chuyi-press h-11 rounded-full bg-[var(--chuyi-ink,#141414)] px-5 text-sm font-medium text-[var(--chuyi-cream,#fffefb)] hover:bg-black'
              render={
                props.isAuthenticated ? (
                  <Link to='/keys' />
                ) : (
                  <Link to='/sign-up' />
                )
              }
            >
              <KeyRound data-icon='inline-start' />
              {t('Get API Key')}
            </Button>
          </div>
          <Button
            variant='outline'
            className='chuyi-press h-11 rounded-full border-[var(--chuyi-ink,#141414)] bg-white px-5 text-sm font-medium'
            render={<Link to='/quickstart' />}
          >
            {t('Quick setup')}
          </Button>
        </div>

        <div className='chuyi-enter chuyi-enter-delay-4 mt-8'>
          <ApiEndpointPill />
        </div>
      </div>

      <div className='chuyi-enter chuyi-enter-delay-2 mt-16 md:mt-20'>
        <RoutingGraphic />
      </div>
    </section>
  )
}
