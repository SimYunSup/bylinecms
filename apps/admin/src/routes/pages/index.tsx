import { Container, Section } from '@byline/uikit/react'
import { createFileRoute } from '@tanstack/react-router'
import type { PagesResponse } from '@/modules/pages/@types'
import { CollectionView } from '@/modules/pages/list'
import { Breadcrumbs } from '@/ui/components/breadcrumbs'

export const Route = createFileRoute('/pages/')({
  loader: async () => {
    const response = await fetch('http://localhost:3001/api/pages')
    if (!response.ok) {
      throw new Error('Failed to fetch pages')
    }
    return response.json()
  },
  component: Index,
})

function Index() {
  const data = Route.useLoaderData()
  return (
    <>
      <Section className="py-2">
        <Container>
          <Breadcrumbs breadcrumbs={[{ label: 'Pages', href: '/pages' }]} />
        </Container>
      </Section>
      <CollectionView data={data} />
    </>
  )
}
