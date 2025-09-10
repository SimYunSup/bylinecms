import type { SerializedEditorState } from 'lexical'

import { hasText } from './hasText'

export const richTextValidate = async (
  value: SerializedEditorState | undefined,
  options: { required?: boolean }
) => {
  // TODO: use i18n client translation provider
  // const { t, required } = options
  const { required } = options

  if (required) {
    if (value == null || value.root == null || value.root.children == null) {
      // return t('validation:required')
      return 'validation:required'
    }

    return hasText(value) ? true : 'validation:required'
  }

  return true
}
