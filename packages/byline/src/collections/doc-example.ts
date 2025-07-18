const sampleDocument = {
  document_id: "019804f5-e055-703f-975a-69ab5fb4304c",
  status: "draft",
  created_at: "2025-07-13T18:04:39.381Z",
  updated_at: "2025-07-13T18:04:39.381Z",
  path: "my-first-bulk-document-13325",
  title: "A bulk created document. 981",
  summary: "This is a sample document for testing purposes.",
  publishedOn: "2024-01-15T03:00:00.000Z",
  featured: false,
  content: [
    {
      richTextBlock: [
        {
          constrainedWidth: true
        },
        {
          richText: {
            root: {
              paragraph: "Some text here..."
            }
          }
        }
      ]
    },
    {
      photoBlock: [
        {
          display: "wide"
        },
        {
          photo: {
            file_id: "019804f5-a505-75bb-add6-719a56a163cd",
            filename: "docs-photo-01.jpg",
            original_filename: "some-original-filename.jpg",
            mime_type: "image/jpeg",
            file_size: "123456",
            storage_provider: "local",
            storage_path: "uploads/docs-photo-01.jpg",
            storage_url: null,
            file_hash: null,
            image_width: null,
            image_height: null,
            image_format: null,
            processing_status: "pending",
            thumbnail_generated: false
          }
        },
        {
          alt: "Some alt text here"
        },
        {
          caption: {
            root: {
              paragraph: "Some text here..."
            }
          }
        }
      ]
    }
  ],
  reviews: [
    {
      reviewItem: [
        {
          rating: 5
        },
        {
          comment: {
            root: {
              paragraph: "Some review text here..."
            }
          }
        }
      ]
    },
    {
      reviewItem: [
        {
          rating: 3
        },
        {
          comment: {
            root: {
              paragraph: "Some more reviews here..."
            }
          }
        }
      ]
    }
  ],
  links: [
    {
      link: "https://example.com"
    },
    {
      link: "https://another-example.com"
    }
  ]
}