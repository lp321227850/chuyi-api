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
import { ArrowUpRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { cn } from '@/lib/utils'

import {
  buildQuickstartSnippet,
  defaultSnippetContext,
  LANGUAGE_FILENAMES,
  QUICKSTART_CLIENTS,
  QUICKSTART_LANGUAGES,
  type QuickstartClient,
  type QuickstartLanguage,
} from './lib/snippets'

const CLIENT_LABEL_KEYS: Record<QuickstartClient, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  gemini: 'Gemini',
  api: 'API',
}

const LANGUAGE_LABELS: Record<QuickstartLanguage, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  curl: 'curl',
  go: 'Go',
  java: 'Java',
  rust: 'Rust',
}

interface QuickstartProps {
  initialClient?: QuickstartClient
}

export function Quickstart(props: QuickstartProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'
  const [client, setClient] = useState<QuickstartClient>(
    props.initialClient ?? 'claude-code'
  )
  const [language, setLanguage] = useState<QuickstartLanguage>('python')
  const snippetContext = useMemo(() => defaultSnippetContext(), [])
  const snippet = buildQuickstartSnippet(client, language, snippetContext)
  const filename = client === 'api' ? LANGUAGE_FILENAMES[language] : '.env'
  const showLanguagePills = client === 'api'

  return (
    <PublicLayout showMainContainer={false}>
      <main className='mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6'>
        <header className='mx-auto mb-10 max-w-3xl text-center'>
          <h1 className='text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight'>
            {t('Quick Start')}
          </h1>
          <p className='text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base'>
            {t(
              'Point existing tools at Chuyi API. Change one Base URL — official SDKs, standard endpoints, no relearning.'
            )}
          </p>
        </header>

        <div className='grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]'>
          <aside className='space-y-4'>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t(
                'Works with Claude Code, Codex, Gemini CLI, Cursor, and other OpenAI-compatible clients.'
              )}
            </p>
            <Link
              to='/about'
              className='block rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'
            >
              <div className='text-sm font-semibold'>
                {t('Full integration guide')}
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                {t('Step-by-step tutorials for mainstream clients and SDKs')}
              </p>
            </Link>
            <Link
              to='/keys'
              className='block rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-white p-4'
            >
              <div className='text-sm font-semibold'>
                {t('Download desktop config tool')}
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                {t('One-click Codex / Claude Code setup for new users')}
              </p>
            </Link>
          </aside>

          <section>
            <div
              className='flex flex-wrap gap-5 border-b border-[var(--chuyi-line,#e6e0d6)]'
              role='tablist'
              aria-label={t('Client')}
            >
              {QUICKSTART_CLIENTS.map((item) => {
                const selected = client === item
                return (
                  <button
                    key={item}
                    type='button'
                    role='tab'
                    aria-selected={selected}
                    className={cn(
                      'pb-2 text-sm font-medium',
                      selected
                        ? 'border-b-2 border-[var(--chuyi-ink,#141414)] text-[var(--chuyi-ink,#141414)]'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => setClient(item)}
                  >
                    {t(CLIENT_LABEL_KEYS[item])}
                  </button>
                )
              })}
            </div>

            <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap gap-2'>
                {showLanguagePills &&
                  QUICKSTART_LANGUAGES.map((item) => {
                    const selected = language === item
                    return (
                      <Button
                        key={item}
                        type='button'
                        size='sm'
                        variant={selected ? 'default' : 'outline'}
                        className={cn(
                          'h-8 rounded-full px-3 text-xs',
                          selected && 'bg-[var(--chuyi-ink,#141414)] text-white'
                        )}
                        aria-pressed={selected}
                        onClick={() => setLanguage(item)}
                      >
                        {LANGUAGE_LABELS[item]}
                      </Button>
                    )
                  })}
              </div>
              <a
                href={docsUrl}
                target={docsUrl.startsWith('http') ? '_blank' : undefined}
                rel='noreferrer'
                className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs'
              >
                {t('View API docs')}
                <ArrowUpRight className='size-3.5' aria-hidden='true' />
              </a>
            </div>

            <div className='mt-4 overflow-hidden rounded-2xl border border-[var(--chuyi-line,#e6e0d6)] bg-[#f7f4ee]'>
              <div className='flex items-center justify-between gap-3 border-b border-[var(--chuyi-line,#e6e0d6)] px-4 py-2.5'>
                <div className='flex items-center gap-2'>
                  <span
                    className='size-2.5 rounded-full bg-[#ff5f57]'
                    aria-hidden
                  />
                  <span
                    className='size-2.5 rounded-full bg-[#febc2e]'
                    aria-hidden
                  />
                  <span
                    className='size-2.5 rounded-full bg-[#28c840]'
                    aria-hidden
                  />
                  <span className='text-muted-foreground ml-2 font-mono text-xs'>
                    {filename}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground hidden text-xs sm:inline'>
                    {snippetContext.model}
                  </span>
                  <CopyButton
                    value={snippet}
                    size='sm'
                    variant='outline'
                    className='h-7 rounded-full px-2.5 text-xs'
                    aria-label={t('Copy')}
                  >
                    {t('Copy')}
                  </CopyButton>
                </div>
              </div>
              <pre className='overflow-x-auto p-4 font-mono text-[13px] leading-6'>
                <code>{snippet}</code>
              </pre>
            </div>
          </section>
        </div>
      </main>
      <Footer variant='compact' />
    </PublicLayout>
  )
}
