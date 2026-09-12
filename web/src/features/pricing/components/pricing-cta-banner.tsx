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
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function PricingCtaBanner() {
  const { t } = useTranslation()

  return (
    <section className='flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-[var(--chuyi-line,#e6e0d6)] bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-6'>
      <h2 className='text-lg font-bold tracking-tight sm:text-xl'>
        {t('Pay as you go. Pay only for what you use.')}
      </h2>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          className='chuyi-press rounded-full bg-[var(--chuyi-ink,#141414)] px-4 text-[var(--chuyi-cream,#fffefb)] hover:bg-black'
          render={<Link to='/wallet' />}
        >
          {t('Buy quota')}
        </Button>
        <Button
          variant='outline'
          className='chuyi-press rounded-full border-[var(--chuyi-ink,#141414)] bg-white px-4'
          render={<Link to='/quickstart' />}
        >
          {t('Quick setup')}
        </Button>
      </div>
    </section>
  )
}
