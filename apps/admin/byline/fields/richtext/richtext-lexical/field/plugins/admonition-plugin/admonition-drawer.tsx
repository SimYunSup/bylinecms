'use client'

import {
  Button,
  CloseIcon,
  IconButton,
  Input,
  Modal,
  Select,
  SelectItem,
} from '@byline/uikit/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import type { AdmonitionType } from '../../nodes/admonition-node/types'
import { admonitionTypeOptions, getInitialState, validateFields } from './fields'
import type { AdmonitionDrawerProps, AdmonitionFormState } from './types'

import './admonition-drawer.css'

export function AdmonitionDrawer({
  open = false,
  onSubmit,
  onClose,
  data: dataFromProps,
}: AdmonitionDrawerProps): React.ReactNode {
  // const { t } = useTranslation()

  const [synchronizedFormState, setSynchronizedFormState] = useState<
    AdmonitionFormState | undefined
  >(undefined)

  const handleOnCancel = (): void => {
    if (onClose != null && typeof onClose === 'function') {
      onClose()
    }
  }

  async function handleOnChange({
    formState,
  }: {
    formState: AdmonitionFormState
  }): Promise<AdmonitionFormState> {
    return new Promise((resolve, reject) => {
      validateFields(formState)
      resolve(formState)
    })
  }

  const handleOnSubmit = (): void => {
    const { valid } = validateFields(synchronizedFormState)
    if (valid === true && synchronizedFormState != null) {
      if (onSubmit != null) {
        onSubmit({
          admonitionType: synchronizedFormState.admonitionType.value as AdmonitionType,
          title: synchronizedFormState.title.value as string,
        })
        setSynchronizedFormState(undefined)
        if (onClose != null && typeof onClose === 'function') {
          onClose()
        }
      }
    }
  }

  useEffect(() => {
    if (synchronizedFormState == null && open === true) {
      const formState = getInitialState(dataFromProps)
      setSynchronizedFormState(formState)
    }
  }, [open, synchronizedFormState, dataFromProps])

  if (open === false) {
    return null
  }

  return (
    <Modal isOpen={open} onDismiss={handleOnCancel} closeOnOverlayClick={false}>
      <Modal.Container className="sm:w-[500px]">
        <Modal.Header className="flex items-center justify-between mb-4">
          <h2>Admonition</h2>
          <IconButton arial-label="Close" size="sm" onClick={handleOnCancel}>
            <CloseIcon width="16px" height="16px" svgClassName="white-icon" />
          </IconButton>
        </Modal.Header>
        <Modal.Content>
          <Input
            id="title"
            name="title"
            placeholder="Title"
            label="Title"
            onChange={(e) => {
              if (synchronizedFormState != null) {
                const newState = {
                  ...synchronizedFormState,
                  title: { ...synchronizedFormState.title, value: e.target.value },
                }
                handleOnChange({ formState: newState }).then((newFormState) => {
                  setSynchronizedFormState(newFormState)
                })
              }
            }}
            value={synchronizedFormState?.title.value ?? ''}
            data-test-id="admonition-modal-title-input"
          />
          <Select
            id="admonitionType"
            name="admonitionType"
            value={synchronizedFormState?.admonitionType.value ?? 'note'}
            onValueChange={(value: AdmonitionType) => {
              if (synchronizedFormState != null) {
                const newState = {
                  ...synchronizedFormState,
                  admonitionType: {
                    ...synchronizedFormState.admonitionType,
                    value,
                  },
                }
                handleOnChange({ formState: newState }).then((newFormState) => {
                  setSynchronizedFormState(newFormState)
                })
              }
            }}
            data-test-id="admonition-modal-type-select"
          >
            {admonitionTypeOptions.map((value) => (
              <SelectItem key={value.value} value={value.value}>
                {value.label}
              </SelectItem>
            ))}
          </Select>
        </Modal.Content>
        <Modal.Actions>
          <Button
            size="sm"
            intent="primary"
            onClick={handleOnSubmit}
            // disabled={isDisabled}
            data-test-id="admonition-modal-submit-button"
          >
            Submit
          </Button>
          <Button size="sm" intent="noeffect" onClick={handleOnCancel} data-autofocus>
            Close
          </Button>
        </Modal.Actions>
      </Modal.Container>
    </Modal>
  )
}
