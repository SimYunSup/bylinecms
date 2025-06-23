'use client'

import { Button, CloseIcon, IconButton, Modal } from '@byline/uikit/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useEditorConfig } from '../../config/editor-config-context'
import type { Position } from '../../nodes/inline-image-node'
import { getInitialState, validateFields } from './fields'
import type { InlineImageData, InlineImageDrawerProps, InlineImageFormState } from './types'

import './inline-image-drawer.css'

const baseClass = 'inline-image-plugin--modal'

export const InlineImageDrawer: React.FC<InlineImageDrawerProps> = ({
  isOpen = false,
  drawerSlug,
  onSubmit,
  onClose,
  data: dataFromProps,
}) => {
  const { config } = useEditorConfig()
  // const { t } = useTranslation()
  const [synchronizedFormState, setSynchronizedFormState] = useState<
    InlineImageFormState | undefined
  >(undefined)

  const handleOnCancel = (): void => {
    setSynchronizedFormState(undefined)
    onClose()
  }

  async function handleFormOnChange({
    formState,
  }: {
    formState: InlineImageFormState
  }): Promise<InlineImageFormState> {
    return new Promise((resolve, reject) => {
      validateFields(formState)
      resolve(formState)
    })
  }

  const handleFormOnSubmit = (
    fields: InlineImageFormState,
    data: Record<string, unknown>
  ): void => {
    const { valid } = validateFields(fields)
    if (valid === true) {
      if (onSubmit != null) {
        const submitData: InlineImageData = {
          id: data.image as string,
          altText: data.altText as string,
          position: data.position as Position,
          showCaption: data.showCaption as boolean,
        }
        onSubmit(submitData)
      }
      setSynchronizedFormState(undefined)
      onClose()
    }
  }

  useEffect(() => {
    if (synchronizedFormState == null && isOpen === true) {
      const formState = getInitialState(dataFromProps)
      setSynchronizedFormState(formState)
    }
  }, [synchronizedFormState, isOpen, dataFromProps])

  if (isOpen === false) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onDismiss={handleOnCancel} closeOnOverlayClick={false}>
      <Modal.Container className="sm:w-[500px]">
        <Modal.Header className="flex items-center justify-between mb-4">
          <h2>Inline Image</h2>
          <IconButton arial-label="Close" size="sm" onClick={handleOnCancel}>
            <CloseIcon width="16px" height="16px" svgClassName="white-icon" />
          </IconButton>
        </Modal.Header>
        <Modal.Content>
          <p>
            Modal content with some text here that should run a little longer. And longer here. And
            the current theme is.
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button size="sm" intent="noeffect" onClick={handleOnCancel} data-autofocus>
            Close
          </Button>
        </Modal.Actions>
      </Modal.Container>
    </Modal>
  )
}
