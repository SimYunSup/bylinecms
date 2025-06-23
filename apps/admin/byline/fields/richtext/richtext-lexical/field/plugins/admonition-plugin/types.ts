import type { AdmonitionType } from '../../nodes/admonition-node/types'

export interface AdmonitionFormState {
  title: {
    value?: string
    initialValue?: string
    valid: boolean
  }
  admonitionType: {
    value?: AdmonitionType
    initialValue?: AdmonitionType
    valid: boolean
  }
}

export interface AdmonitionData {
  admonitionType: AdmonitionType
  title: string
}

export interface AdmonitionDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AdmonitionData) => void
  data: {
    admonitionType?: AdmonitionType
    title?: string
  }
}
