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
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const API_PROFILES = [
  { id: 'openai', labelKey: 'OpenAI API', path: '/v1' },
  { id: 'anthropic', labelKey: 'Anthropic API', path: '/v1' },
  { id: 'gemini', labelKey: 'Gemini API', path: '/v1' },
] as const

function currentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export function ApiEndpointPill() {
  const { t } = useTranslation()
  const [profileId, setProfileId] =
    useState<(typeof API_PROFILES)[number]['id']>('openai')
  const profile =
    API_PROFILES.find((item) => item.id === profileId) ?? API_PROFILES[0]
  const url = useMemo(() => `${currentOrigin()}${profile.path}`, [profile.path])

  return (
    <div className='inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--chuyi-line,#e6e0d6)] bg-white px-2 py-1.5 shadow-[0_1px_2px_rgb(20_20_20/0.04)]'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='sm'
              className='h-7 gap-1 rounded-full px-2 text-xs font-medium'
            />
          }
        >
          {t(profile.labelKey)}
          <ChevronDown className='size-3.5' aria-hidden='true' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          {API_PROFILES.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setProfileId(item.id)}
            >
              {t(item.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <code className='text-muted-foreground max-w-[14rem] truncate font-mono text-xs sm:max-w-none'>
        {url}
      </code>
      <CopyButton
        value={url}
        size='icon-xs'
        tooltip={t('Copy')}
        aria-label={t('Copy API base URL')}
      />
    </div>
  )
}
