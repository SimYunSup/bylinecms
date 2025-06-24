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
