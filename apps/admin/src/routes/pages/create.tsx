import { Container, Section } from '@byline/uikit/react'
import { createFileRoute } from '@tanstack/react-router'
import { CreateView } from '@/modules/pages/create'
import { Breadcrumbs } from '@/ui/components/breadcrumbs'

export const Route = createFileRoute('/pages/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Section className="py-2">
        <Container>
          <Breadcrumbs
            breadcrumbs={[
              { label: 'Pages', href: '/pages' },
              { label: 'Create Page', href: '/pages/create' },
            ]}
          />
        </Container>
      </Section>
      <CreateView />
    </>
  )
}
