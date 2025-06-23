import { Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { Pages } from '~/collections/pages'
import { FormRenderer } from '~/fields/form-renderer'

export const EditView = ({ initialData }: { initialData: any }) => {
  const navigate = useNavigate()

  const handleSubmit = async (data: any) => {
    try {
      const putRes = await fetch(`http://localhost:3001/api/pages/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!putRes.ok) {
        console.error(`Failed to update page: ${putRes.statusText}`)
      } else {
        navigate({
          to: '/pages',
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
        <h2 className="mb-2">Edit Page</h2>
        <FormRenderer
          fields={Pages.fields}
          onSubmit={handleSubmit}
          initialData={initialData}
          onCancel={() => navigate({ to: '/pages' })}
        />
      </Container>
    </Section>
  )
}
