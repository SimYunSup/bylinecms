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
 * Copyright notices appear at the top of source files where applicable
 * and are licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/facebook/lexical
 *
 * Portions Copyright (c) Payload CMS, LLC info@payloadcms.com
 * Copyright notices appear at the top of source files where applicable
 * and are licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree
 *
 * https://github.com/payloadcms/payload/
 *
 * Debounce strategy adapted from
 * https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical
 *
 *
 * Note: For historical context see...
 *
 * https://github.com/facebook/lexical/commits?author=58bits
 * https://github.com/infonomic/payload-alternative-lexical-richtext-editor
 * https://github.com/AlessioGr/payload-plugin-lexical/commits?author=58bits
 * https://github.com/payloadcms/payload/commits?author=58bits
 *
 */

import { ErrorText, HelpText, Label } from '@byline/uikit/react'
import type { EditorState, SerializedEditorState } from 'lexical'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffectEvent } from '~/hooks/use-effect-event'
import type { LexicalRichTextFieldProps } from '../types'
import { richTextValidate } from '../validate/validate'
import { EditorContext } from './editor-context'

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
  initialValue,
  value,
  onChange,
  validate = richTextValidate,
  onError,
  lexicalEditorProps,
}: LexicalRichTextFieldProps): React.JSX.Element {
  const disabled = readonly ?? false
  const dispatchFieldUpdateTask = useRef<number>(undefined)
  const [rerenderProviderKey, setRerenderProviderKey] = useState<Date>()
  const prevInitialValueRef = React.useRef<SerializedEditorState | undefined>(initialValue)
  const prevValueRef = React.useRef<SerializedEditorState | undefined>(value)

  // TODO: implement validation handling
  const memoizedValidate = useCallback(
    (value: SerializedEditorState | undefined) => {
      if (typeof validate === 'function') {
        return validate(value, { required })
      }
      return true
    },
    [validate, required]
  )

  // Debounce editor as per this Payload PR and commit:
  // https://github.com/payloadcms/payload/pull/12086/files
  // https://github.com/payloadcms/payload/commit/1d5d96d
  const handleChange = useCallback(
    (editorState: EditorState) => {
      const updateFieldValue = (editorState: EditorState) => {
        const newState = editorState.toJSON()
        prevValueRef.current = newState
        if (onChange !== null && typeof onChange === 'function') {
          onChange(newState)
        }
      }

      if (typeof window.requestIdleCallback === 'function') {
        // Cancel earlier scheduled value updates,
        // so that a CPU-limited event loop isn't flooded with n callbacks for n keystrokes into the rich text field,
        // but that there's only ever the latest one state update
        // dispatch task, to be executed with the next idle time,
        // or the deadline of 500ms.
        if (typeof window.cancelIdleCallback === 'function' && dispatchFieldUpdateTask.current) {
          cancelIdleCallback(dispatchFieldUpdateTask.current)
        }
        // Schedule the state update to happen the next time the browser has sufficient resources,
        // or the latest after 500ms.
        dispatchFieldUpdateTask.current = requestIdleCallback(() => updateFieldValue(editorState), {
          timeout: 500,
        })
      } else {
        updateFieldValue(editorState)
      }
    },
    [onChange]
  )

  const handleInitialValueChange = useEffectEvent(
    (initialValue: SerializedEditorState | undefined) => {
      // Object deep equality check here, as re-mounting the editor if
      // the new value is the same as the old one is not necessary
      if (
        prevValueRef.current !== value &&
        JSON.stringify(prevValueRef.current) !== JSON.stringify(value)
      ) {
        prevInitialValueRef.current = initialValue
        prevValueRef.current = value
        setRerenderProviderKey(new Date())
      }
    }
  )

  useEffect(() => {
    // Needs to trigger for object reference changes - otherwise,
    // reacting to the same initial value change twice will cause
    // the second change to be ignored, even though the value has changed.
    // That's because initialValue is not kept up-to-date
    if (!Object.is(initialValue, prevInitialValueRef.current)) {
      handleInitialValueChange(initialValue)
    }
  }, [initialValue, handleInitialValueChange])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {label && <Label id="label" label={label} htmlFor={id} required={required} />}
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          <EditorContext
            composerKey={id}
            editorConfig={editorConfig}
            key={JSON.stringify({ name, rerenderProviderKey })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
            onChange={handleChange}
            readOnly={disabled}
            value={initialValue}
            // NOTE: 2023-05-15 disabled the deepEqual since we've set ignoreSelectionChange={true}
            // in our OnChangePlugin instances - and so a call here means that something
            // must have changed - so no need to do the comparison.
            // onChange={(editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {
            //   if (!disabled) {
            //     const serializedEditorState = editorState.toJSON()
            //     // TODO: 2024-01-30 - re-test this.
            //     // NOTE: 2023-06-28 fix for setValue below. For some reason when
            //     // this custom field is used in a block field, setValue on its
            //     // own won't enable Save Draft or Publish Changes during a first
            //     // add of a new block (it will after the entire document is saved
            //     // and reloaded - but not before.) So call setModified(true) here
            //     // to guarantee that we can always save our changes.
            //     // setModified(true)
            //     // NOTE: 2024-05-02: Appears to be fixed - and setModified(true)
            //     // is no longer required.
            //     setValue(serializedEditorState)
            //   }
            // }}
          />
        </ErrorBoundary>
        {description && <HelpText text={description} />}
      </div>
    </div>
  )
}

function fallbackRender({ error, resetErrorBoundary }: any): React.JSX.Element {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  return (
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export const RichText: typeof RichTextComponent = RichTextComponent
