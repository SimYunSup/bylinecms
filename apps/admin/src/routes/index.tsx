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

import { Card, Container, Section } from '@byline/uikit/react'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <Section className="py-6">
      <Container>
        <div className="grid grid-cols-auto-fit-320 gap-6">
          <Card asChild hover={true}>
            <Link to="/collections/pages" className="block">
              <Card.Header>
                <Card.Title>Pages</Card.Title>
                <Card.Description>Pages collection...</Card.Description>
              </Card.Header>
              <Card.Content>
                <p>Pages collection description or stats here...</p>
              </Card.Content>
            </Link>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Docs</Card.Title>
              <Card.Description>Docs collection...</Card.Description>
            </Card.Header>
            <Card.Content>
              <p>Docs collection description or stats here...</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>News</Card.Title>
              <Card.Description>News collection...</Card.Description>
            </Card.Header>
            <Card.Content>
              <p>News collection description or stats here...</p>
            </Card.Content>
          </Card>
        </div>
      </Container>
    </Section>
  )
}
