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
import { api } from '@/lib/api'

import type { PricingData } from './types'

// ----------------------------------------------------------------------------
// Pricing APIs
// ----------------------------------------------------------------------------

const failedPricing: PricingData = {
  success: false,
  data: [],
  vendors: [],
  group_ratio: {},
  usable_group: {},
  supported_endpoint: {},
  auto_groups: [],
}

// Get model pricing data. Catalog failures stay on /pricing so the page
// can render an in-place retry instead of the global /500 route.
export async function getPricing(): Promise<PricingData> {
  try {
    const res = await api.get('/api/pricing', {
      skipErrorHandler: true,
      skipBusinessError: true,
    })
    const payload = res.data as PricingData | undefined
    if (payload && typeof payload.success === 'boolean') {
      return payload
    }
    return failedPricing
  } catch {
    return failedPricing
  }
}
