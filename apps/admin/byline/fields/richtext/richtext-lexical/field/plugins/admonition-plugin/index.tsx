'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  type LexicalCommand,
} from 'lexical'
import * as React from 'react'
import { useEffect } from 'react'
import { $createAdmonitionNode, AdmonitionNode } from '../../nodes/admonition-node'
import type { AdmonitionAttributes } from '../../nodes/admonition-node/types'
import { AdmonitionDrawer } from './admonition-drawer'
import type { AdmonitionData } from './types'

export type InsertAdmonitionPayload = Readonly<AdmonitionAttributes>

export const OPEN_ADMONITION_MODAL_COMMAND: LexicalCommand<null> = createCommand(
  'OPEN_ADMONITION_MODAL_COMMAND'
)

export const INSERT_ADMONITION_COMMAND: LexicalCommand<AdmonitionAttributes> = createCommand(
  'INSERT_ADMONITION_COMMAND'
)

export function AdmonitionPlugin(): React.JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    if (!editor.hasNodes([AdmonitionNode])) {
      throw new Error('AdmonitionPlugin: AdmonitionNode not registered on editor')
    }

    return mergeRegister(
      // TODO: possibly register this command with insert and edit options?
      editor.registerCommand<null>(
        OPEN_ADMONITION_MODAL_COMMAND,
        () => {
          setOpen(true)
          return true
        },
        COMMAND_PRIORITY_NORMAL
      ),

      editor.registerCommand<InsertAdmonitionPayload>(
        INSERT_ADMONITION_COMMAND,
        (payload: AdmonitionAttributes) => {
          // return true
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }

          const focusNode = selection.focus.getNode()

          if (focusNode !== null) {
            const admonitionNode = $createAdmonitionNode(payload)
            $insertNodeToNearestRoot(admonitionNode)
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    )
  }, [editor])

  const handleInsertAdmonition = ({ admonitionType, title }: AdmonitionData): void => {
    if (title != null && admonitionType != null) {
      const admonitionPayload: AdmonitionAttributes = {
        admonitionType,
        title,
      }

      editor.dispatchCommand(INSERT_ADMONITION_COMMAND, admonitionPayload)
    } else {
      console.error('Error: missing title or type for admonition.')
    }
    setOpen(false)
  }

  return (
    <AdmonitionDrawer
      open={open}
      data={{ title: '', admonitionType: undefined }}
      onClose={() => setOpen(false)}
      onSubmit={handleInsertAdmonition}
    />
  )
}
