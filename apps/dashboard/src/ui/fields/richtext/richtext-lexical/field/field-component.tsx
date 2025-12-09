'use client'

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

/**
 * Portions Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 *
 * Portions Copyright (c) Payload CMS, LLC info@payloadcms.com
 * Licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 *
 * Debounce strategy adapted from
 * https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical
 */

import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { HelpText, Label } from '@infonomic/uikit/react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EditorState, SerializedEditorState } from 'lexical'
import { ErrorBoundary } from 'react-error-boundary'

import { richTextValidate } from '../validate/validate'
import { EditorContext } from './editor-context'
import type { LexicalRichTextFieldProps } from '../types'

import './field-component.css'
import './themes/lexical-editor-theme.css'

const baseClass = 'lexicalRichTextEditor'

export function RichTextComponent({
  name,
  id,
  label,
  description,
  required,
  readonly,
  editorConfig,
  defaultValue,
  value,
  onChange,
  validate = richTextValidate,
  onError: _onError,
  lexicalEditorProps: _lexicalEditorProps,
}: LexicalRichTextFieldProps): React.JSX.Element {
  const disabled = readonly ?? false
  const dispatchFieldUpdateTask = useRef<number>(undefined)
  const lastEmittedHashRef = useRef<string | undefined>(undefined)

  // TODO: implement validation handling (currently unused)
  const _memoizedValidate = useCallback(
    (val: SerializedEditorState | undefined) => {
      if (typeof validate === 'function') {
        return validate(val, { required })
      }
      return true
    },
    [validate, required]
  )

  // Debounced onChange -> emit to store
  const handleChange = useCallback(
    (editorState: EditorState) => {
      const updateFieldValue = (state: EditorState) => {
        const newState = state.toJSON()
        lastEmittedHashRef.current = hashSerializedState(newState)
        if (typeof onChange === 'function') {
          onChange(newState)
        }
      }

      if (typeof window.requestIdleCallback === 'function') {
        if (typeof window.cancelIdleCallback === 'function' && dispatchFieldUpdateTask.current) {
          cancelIdleCallback(dispatchFieldUpdateTask.current)
        }
        dispatchFieldUpdateTask.current = requestIdleCallback(() => updateFieldValue(editorState), {
          timeout: 500,
        })
      } else {
        updateFieldValue(editorState)
      }
    },
    [onChange]
  )

  const incomingValue = useMemo<SerializedEditorState | undefined>(() => {
    return value ?? defaultValue ?? undefined
  }, [value, defaultValue])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {label && <Label id="label" label={label} htmlFor={id} required={required} />}
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          <EditorContext
            composerKey={id}
            editorConfig={editorConfig}
            key={id}
            onChange={handleChange}
            readOnly={disabled}
            value={incomingValue}
          >
            <ApplyValuePlugin value={incomingValue} lastEmittedHashRef={lastEmittedHashRef} />
          </EditorContext>
        </ErrorBoundary>
        {description && <HelpText text={description} />}
      </div>
    </div>
  )
}

export const ApplyValuePlugin = ({
  value,
  lastEmittedHashRef,
}: {
  value?: SerializedEditorState
  lastEmittedHashRef: React.RefObject<string | undefined>
}) => {
  const [editor] = useLexicalComposerContext()
  const lastAppliedHashRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (value == null) return
    const nextHash = hashSerializedState(value)
    if (nextHash === lastAppliedHashRef.current) return
    if (nextHash === lastEmittedHashRef.current) return

    editor.update(() => {
      const nextState = editor.parseEditorState(value)
      editor.setEditorState(nextState)
    })

    lastAppliedHashRef.current = nextHash
  }, [editor, value, lastEmittedHashRef])

  return null
}

// Simple FNV-1a hash for serialized editor state
export function hashSerializedState(state: SerializedEditorState | string): string {
  const str = typeof state === 'string' ? state : JSON.stringify(state)
  let hash = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

function fallbackRender({ error }: any): React.JSX.Element {
  return (
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export const RichText: typeof RichTextComponent = RichTextComponent
