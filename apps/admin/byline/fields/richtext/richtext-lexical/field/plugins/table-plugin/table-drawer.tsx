'use client'

import { Button, CloseIcon, IconButton, Input, Modal } from '@byline/uikit/react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type * as React from 'react'
import { useEffect, useState } from 'react'

export function TableDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [activeEditor] = useState(editor)

  const [rows, setRows] = useState('5')
  const [columns, setColumns] = useState('5')
  const [isDisabled, setIsDisabled] = useState(true)

  useEffect(() => {
    const row = Number(rows)
    const column = Number(columns)
    if (row !== 0 && row > 0 && row <= 500 && column !== 0 && column > 0 && column <= 50) {
      setIsDisabled(false)
    } else {
      setIsDisabled(true)
    }
  }, [rows, columns])

  const handleOnSubmit = (): void => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
    })

    if (onClose != null && typeof onClose === 'function') {
      onClose()
    }
  }

  // TODO - validate
  const handleOnRowsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRows(event.target.value)
  }

  // TODO - validate
  const handleOnColumnsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setColumns(event.target.value)
  }

  const handleOnCancel = (): void => {
    if (onClose != null && typeof onClose === 'function') {
      onClose()
    }
  }

  return (
    <Modal isOpen={open} onDismiss={handleOnCancel} closeOnOverlayClick={false}>
      <Modal.Container className="sm:w-[500px]">
        <Modal.Header className="flex items-center justify-between mb-4">
          <h2>Insert Table</h2>
          <IconButton arial-label="Close" size="sm" onClick={handleOnCancel}>
            <CloseIcon width="16px" height="16px" svgClassName="white-icon" />
          </IconButton>
        </Modal.Header>
        <Modal.Content>
          <Input
            id="number-of-rows"
            name="number-of-rows"
            type="number"
            placeholder={'# of rows (1-500)'}
            label="Rows"
            onChange={handleOnRowsChange}
            value={rows}
            data-test-id="table-modal-rows"
          />
          <Input
            id="number-of-columns"
            name="number-of-columns"
            type="number"
            placeholder={'# of columns (1-50)'}
            label="Columns"
            onChange={handleOnColumnsChange}
            value={columns}
            data-test-id="table-modal-columns"
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            size="sm"
            intent="primary"
            onClick={handleOnSubmit}
            disabled={isDisabled}
            data-test-id="table-modal-submit"
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
