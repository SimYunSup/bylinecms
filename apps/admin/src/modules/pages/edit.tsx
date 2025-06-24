import { Button, Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import type { Page } from '@/modules/pages/@types'
import { Pages } from '~/collections/pages'
import { FormRenderer } from '~/fields/form-renderer'

export const EditView = ({ initialData }: { initialData: Page }) => {
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
        <div className="item-view flex flex-col sm:flex-row justify-start sm:justify-between">
          <h2 className="mb-2">Edit Page</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="filled"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({ to: '/collections/pages/$postid', params: { postid: initialData.id } })
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outlined"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({ to: '/collections/pages/$postid', params: { postid: initialData.id } })
              }
            >
              API
            </Button>
          </div>
        </div>
        <FormRenderer
          fields={Pages.fields}
          onSubmit={handleSubmit}
          initialData={initialData}
          onCancel={() => navigate({ to: '/collections/pages' })}
        />
      </Container>
    </Section>
  )
}
