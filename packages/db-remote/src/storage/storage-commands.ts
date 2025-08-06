/**
 * Byline CMS Server Tests
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

import type { CollectionDefinition, ICollectionCommands, IDocumentCommands } from '@byline/core'

/**
 * CollectionCommands
 */
export class CollectionCommands implements ICollectionCommands {
  async create(path: string, config: CollectionDefinition) {
    throw new Error('db-remote method not implemented')
  }

  async delete(id: string) {
    throw new Error('db-remote method not implemented')
  }
}

/**
 * DocumentCommands
 */
export class DocumentCommands implements IDocumentCommands {
  /**
   * createDocumentVersion
   *
   * Creates a new document or a new version of an existing document.
   *
   * @param params - Options for creating the document
   * @returns The created document and the number of field values inserted
   */
  // @ts-ignore
  async createDocumentVersion(params: {
    documentId?: string // Optional logical document ID when creating a new version for the same logical document
    collectionId: string
    collectionConfig: CollectionDefinition
    action: string
    documentData: any
    path: string
    locale?: string
    status?: 'draft' | 'published' | 'archived'
    createdBy?: string
  }) {
    throw new Error('db-remote method not implemented')
  }
}
/**
 * Factory function
 * @param siteConfig
 * @param db
 * @returns
 */
export function createCommandBuilders(db: null) {
  return {
    collections: new CollectionCommands(),
    documents: new DocumentCommands(),
  }
}
