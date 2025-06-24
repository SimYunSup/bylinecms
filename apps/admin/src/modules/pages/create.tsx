import { Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { Pages } from '~/collections/pages'
import { FormRenderer } from '~/fields/form-renderer'

export const CreateView = () => {
  const navigate = useNavigate()
  // const location = useRouterState({ select: (s) => s.location })

  const handleSubmit = async (data: any) => {
    try {
      const postRes = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!postRes.ok) {
        console.error(`Failed to create page: ${postRes.statusText}`)
      }
      const res = await fetch('http://localhost:3001/api/pages')
      if (!res.ok) {
        console.error(`Failed to fetch pages: ${res.statusText}`)
      } else {
        navigate({
          to: '/collections/pages',
        })
      }
    } catch (err) {
      // Optionally, you can show this error to the user
      console.error(err)
    }
  }

  return (
    <Section>
      <Container>
        <h2 className="mb-2">Create Page</h2>
        <FormRenderer
          fields={Pages.fields}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: '/collections/pages' })}
        />
      </Container>
    </Section>
  )
}
