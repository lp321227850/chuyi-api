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
import { EXCLUDED_GROUPS, FILTER_ALL, QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'

// ----------------------------------------------------------------------------
// Model Helper Utilities
// ----------------------------------------------------------------------------

/**
 * Get available groups for a model
 */
export function getAvailableGroups(
  model: PricingModel,
  usableGroup: Record<string, { desc: string; ratio: number }>
): string[] {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []

  return Object.keys(usableGroup)
    .filter((g) => !EXCLUDED_GROUPS.includes(g))
    .filter((g) => modelEnableGroups.includes(g))
}

/**
 * Read a configured group ratio while preserving valid zero ratios.
 */
export function getConfiguredGroupRatio(
  groupRatio: Record<string, number>,
  group: string
): number {
  const ratio = groupRatio[group]
  return typeof ratio === 'number' && Number.isFinite(ratio) ? ratio : 1
}

/**
 * Whether this catalog row is billed under the selected group.
 * Empty / `all` enable_groups mean the model is offered in every billing group.
 */
export function modelAppliesToBillingGroup(
  model: PricingModel,
  selectedGroup?: string
): boolean {
  if (!selectedGroup || selectedGroup === FILTER_ALL) return true
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []
  if (modelEnableGroups.length === 0 || modelEnableGroups.includes('all')) {
    return true
  }
  return modelEnableGroups.includes(selectedGroup)
}

/**
 * Resolve the group ratio used by model square summary prices.
 *
 * When no specific group is selected, the model square shows the best price
 * among billing groups the model is actually enabled for. When a group filter
 * is active, it shows that group's price only if the row belongs to it.
 * Unmatched enable_groups (for example a channel name) do not inherit another
 * group's ratio.
 */
export function getDisplayGroupRatio(
  model: PricingModel,
  selectedGroup?: string
): number {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []
  const groupRatio = model.group_ratio || {}

  if (selectedGroup && selectedGroup !== FILTER_ALL) {
    if (!modelAppliesToBillingGroup(model, selectedGroup)) {
      return 1
    }
    return getConfiguredGroupRatio(groupRatio, selectedGroup)
  }

  const treatAsAll =
    modelEnableGroups.length === 0 || modelEnableGroups.includes('all')
  const candidateGroups = treatAsAll
    ? Object.keys(groupRatio)
    : modelEnableGroups

  return minConfiguredGroupRatio(groupRatio, candidateGroups) ?? 1
}

function minConfiguredGroupRatio(
  groupRatio: Record<string, number>,
  groups: string[]
): number | null {
  let minRatio = Number.POSITIVE_INFINITY
  for (const group of groups) {
    if (EXCLUDED_GROUPS.includes(group) || group === 'all') continue
    const ratio = groupRatio[group]
    if (
      typeof ratio === 'number' &&
      Number.isFinite(ratio) &&
      ratio < minRatio
    ) {
      minRatio = ratio
    }
  }
  return minRatio === Number.POSITIVE_INFINITY ? null : minRatio
}

/**
 * Replace model placeholder in endpoint path
 */
export function replaceModelInPath(path: string, modelName: string): string {
  return path.replaceAll('{model}', modelName)
}

/**
 * Check if model is token-based pricing
 */
export function isTokenBasedModel(model: PricingModel): boolean {
  return model.quota_type === QUOTA_TYPE_VALUES.TOKEN
}
