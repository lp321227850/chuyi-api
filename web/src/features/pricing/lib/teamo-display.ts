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
export function formatContextWindow(length?: number): string {
  if (!length || !Number.isFinite(length) || length <= 0) return '—'
  if (length >= 1_000_000) {
    const millions = length / 1_000_000
    return `${Number.isInteger(millions) ? millions.toFixed(0) : stripPointZero(millions)}M`
  }
  if (length >= 1000) {
    const thousands = length / 1000
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : stripPointZero(thousands)}K`
  }
  return String(length)
}

function stripPointZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

export const TEAMO_TABLE_PREVIEW_COUNT = 12
