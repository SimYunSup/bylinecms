import { Container, Section } from '@byline/uikit/react'
import { createFileRoute } from '@tanstack/react-router'
import type { Page } from '@/modules//pages/@types'
import { EditView } from '@/modules/pages/edit'
import { Breadcrumbs } from '@/ui/components/breadcrumbs'

export const Route = createFileRoute('/collections/pages/$postid')({
  loader: async ({ params }): Promise<Page> => {
    const response = await fetch(`http://localhost:3001/api/pages/${params.postid}`)
    if (!response.ok) {
      throw new Error('Failed to fetch page')
    }
    return response.json()
  },
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  component: Index,
})

function Index() {
  const pageData = Route.useLoaderData()

  return (
    <>
      <Section className="py-2">
        <Container>
          <Breadcrumbs
            breadcrumbs={[
              { label: 'Pages', href: '/collections/pages' },
              { label: pageData.title || 'Edit Page', href: `/pages/${pageData.id}` },
            ]}
          />
        </Container>
      </Section>
      <EditView initialData={pageData} />
    </>
  )
}
