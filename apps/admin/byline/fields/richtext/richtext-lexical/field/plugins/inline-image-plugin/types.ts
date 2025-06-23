import type { Position } from '../../nodes/inline-image-node/types'

export interface InlineImageData {
  id?: string
  altText?: string
  position?: Position
  showCaption?: boolean
}

export interface InlineImageDrawerProps {
  isOpen: boolean
  drawerSlug: string
  onClose: () => void
  onSubmit: (data: InlineImageData) => void
  data?: InlineImageData
}

export interface InlineImageFormState {
  image: {
    value: string | undefined
    initialValue: string | undefined
    valid: boolean
  }
  altText: {
    value: string | undefined
    initialValue: string | undefined
    valid: boolean
  }
  position: {
    value: 'left' | 'right' | 'full' | 'wide' | 'default'
    initialValue: 'left' | 'right' | 'full' | 'wide' | 'default'
    valid: boolean
  }
  showCaption: {
    value: boolean
    initialValue: boolean
    valid: boolean
  }
}
