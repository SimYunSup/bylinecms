/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { FileField as FieldType, StoredFileValue } from '@byline/core'

import { useFieldError, useIsDirty } from '../form-context'

interface FileFieldProps {
  field: FieldType
  // Stored value is currently a plain object with file metadata
  // coming from the seed data / storage layer.
  initialValue?: StoredFileValue | null
  onChange?: (value: StoredFileValue | null) => void
}

export const FileField = ({ field, initialValue, onChange }: FileFieldProps) => {
  const fieldError = useFieldError(field.name)
  const isDirty = useIsDirty(field.name)

  const value = initialValue ?? null

  return (
    <div className={isDirty ? 'border border-blue-300 rounded-md p-3' : ''}>
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <div className="text-sm font-medium text-gray-100">
            {field.label ?? field.name}
            {field.required ? ' *' : ''}
          </div>
          {field.helpText && <div className="mt-0.5 text-xs text-gray-400">{field.helpText}</div>}
        </div>
        {/* Placeholder action area for future upload UI */}
        <button
          type="button"
          className="text-xs text-blue-300 hover:text-blue-200 underline-offset-2 hover:underline"
          disabled
        >
          Upload (coming soon)
        </button>
      </div>

      {value == null ? (
        <div className="text-xs text-gray-500 italic">No file selected</div>
      ) : (
        <div className="mt-1 text-xs text-gray-200 space-y-0.5">
          {'filename' in value && (
            <div>
              <span className="font-semibold">Filename:</span> {value.filename}
            </div>
          )}
          {'original_filename' in value && (
            <div>
              <span className="font-semibold">Original:</span> {value.original_filename}
            </div>
          )}
          {'mime_type' in value && (
            <div>
              <span className="font-semibold">Type:</span> {value.mime_type}
            </div>
          )}
          {'file_size' in value && (
            <div>
              <span className="font-semibold">Size:</span> {value.file_size}
            </div>
          )}
          {'storage_provider' in value && (
            <div>
              <span className="font-semibold">Storage:</span> {value.storage_provider}
            </div>
          )}
          {'storage_path' in value && (
            <div>
              <span className="font-semibold">Path:</span> {value.storage_path}
            </div>
          )}
        </div>
      )}

      {fieldError && <div className="mt-1 text-xs text-red-400">{fieldError}</div>}
    </div>
  )
}
