'use client'

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
 *
 * Note: For historical context see...
 *
 * https://github.com/facebook/lexical/commits?author=58bits
 * https://github.com/infonomic/payload-alternative-lexical-richtext-editor
 * https://github.com/AlessioGr/payload-plugin-lexical/commits?author=58bits
 * https://github.com/payloadcms/payload/commits?author=58bits
 *
 *
 */

import type * as React from 'react'
import { lazy, Suspense } from 'react'

import { Shimmer } from '@infonomic/uikit/react'

import type { LexicalRichTextFieldProps } from '../types'

const RichTextEditor = lazy(() =>
  import('./field-component').then((module) => ({ default: module.RichText }))
)

export function RichTextField(props: LexicalRichTextFieldProps): React.JSX.Element {
  return (
    <Suspense fallback={<Shimmer variant="text" lines={8} />}>
      <RichTextEditor {...props} />
    </Suspense>
  )
}
