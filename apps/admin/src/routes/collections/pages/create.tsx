import { Container, Section } from '@byline/uikit/react'
import { createFileRoute } from '@tanstack/react-router'
import { CreateView } from '@/modules/pages/create'
import { Breadcrumbs } from '@/ui/components/breadcrumbs'

export const Route = createFileRoute('/collections/pages/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Section className="py-2">
        <Container>
          <Breadcrumbs
            breadcrumbs={[
              { label: 'Pages', href: '/collections/pages' },
              { label: 'Create Page', href: '/collections/pages/create' },
            ]}
          />
        </Container>
      </Section>
      <CreateView />
    </>
  )
}
