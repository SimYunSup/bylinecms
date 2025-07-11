import { sql } from "drizzle-orm"

export const textFields = sql`
  id,
  document_version_id,
  collection_id,
  'text' as "field_type",
  field_path,
  field_name,
  locale,
  parent_path,
  value as "text_value",
  NULL::text as "numeric_value",
  NULL::boolean as "boolean_value",
  NULL::jsonb as "json_value",
  NULL::varchar as "date_type",
  NULL::date as "value_date",
  NULL::time as "value_time",
  NULL::timestamp as "value_timestamp",
  NULL::timestamp as "value_timestamp_tz",
  NULL::uuid as "file_id",
  NULL::varchar as "filename",
  NULL::varchar as "original_filename",
  NULL::varchar as "mime_type",
  NULL::bigint as "file_size",
  NULL::varchar as "storage_provider",
  NULL::text as "storage_path",
  NULL::text as "storage_url",
  NULL::varchar as "file_hash",
  NULL::integer as "image_width",
  NULL::integer as "image_height",
  NULL::varchar as "image_format",
  NULL::varchar as "processing_status",
  NULL::boolean as "thumbnail_generated",
  NULL::uuid as "target_document_id",
  NULL::uuid as "target_collection_id",
  NULL::varchar as "relationship_type",
  NULL::boolean as "cascade_delete",
  NULL::varchar as "json_schema",
  NULL::text[] as "object_keys",
  NULL::varchar as "number_type",
  NULL::integer as "value_integer",
  NULL::decimal as "value_decimal",
  NULL::real as "value_float"
`

export const numericFields = sql`
  id,
  document_version_id,
  collection_id,
  'numeric',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  COALESCE(value_integer::text, value_decimal::text, value_float::text),  -- numeric_value
  NULL,  -- boolean_value
  NULL,  -- json_value
  NULL,  -- date_type
  NULL,  -- value_date
  NULL,  -- value_time
  NULL,  -- value_timestamp
  NULL,  -- value_timestamp_tz
  NULL,  -- file_id
  NULL,  -- filename
  NULL,  -- original_filename
  NULL,  -- mime_type
  NULL,  -- file_size
  NULL,  -- storage_provider
  NULL,  -- storage_path
  NULL,  -- storage_url
  NULL,  -- file_hash
  NULL,  -- image_width
  NULL,  -- image_height
  NULL,  -- image_format
  NULL,  -- processing_status
  NULL,  -- thumbnail_generated
  NULL,  -- target_document_id
  NULL,  -- target_collection_id
  NULL,  -- relationship_type
  NULL,  -- cascade_delete
  NULL,  -- json_schema
  NULL,  -- object_keys
  number_type,  -- number_type
  value_integer,  -- value_integer
  value_decimal,  -- value_decimal
  value_float  -- value_float
`

export const booleanFields = sql`
  id, 
  document_version_id,
  collection_id,
  'boolean',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  NULL,  -- numeric_value
  value, -- boolean_value
  NULL,  -- json_value
  NULL,  -- date_type
  NULL,  -- value_date
  NULL,  -- value_time
  NULL,  -- value_timestamp
  NULL,  -- value_timestamp_tz
  NULL,  -- file_id
  NULL,  -- filename
  NULL,  -- original_filename
  NULL,  -- mime_type
  NULL,  -- file_size
  NULL,  -- storage_provider
  NULL,  -- storage_path
  NULL,  -- storage_url
  NULL,  -- file_hash
  NULL,  -- image_width
  NULL,  -- image_height
  NULL,  -- image_format
  NULL,  -- processing_status
  NULL,  -- thumbnail_generated
  NULL,  -- target_document_id
  NULL,  -- target_collection_id
  NULL,  -- relationship_type
  NULL,  -- cascade_delete
  NULL,  -- json_schema
  NULL,  -- object_keys
  NULL,  -- number_type
  NULL,  -- value_integer
  NULL,  -- value_decimal
  NULL  -- value_float
`

export const datetimeFields = sql`
  id,
  document_version_id,
  collection_id,
  'datetime',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  NULL,  -- numeric_value
  NULL,  -- boolean_value
  NULL,  -- json_value
  date_type,  -- date_type
  value_date, -- value_date
  value_time, -- value_time
  value_timestamp, -- value_timestamp
  value_timestamp_tz, -- value_timestamp_tz
  NULL,  -- file_id
  NULL,  -- filename
  NULL,  -- original_filename
  NULL,  -- mime_type
  NULL,  -- file_size
  NULL,  -- storage_provider
  NULL,  -- storage_path
  NULL,  -- storage_url
  NULL,  -- file_hash
  NULL,  -- image_width
  NULL,  -- image_height
  NULL,  -- image_format
  NULL,  -- processing_status
  NULL,  -- thumbnail_generated
  NULL,  -- target_document_id
  NULL,  -- target_collection_id
  NULL,  -- relationship_type
  NULL,  -- cascade_delete
  NULL,  -- json_schema
  NULL,  -- object_keys
  NULL,  -- number_type
  NULL,  -- value_integer
  NULL,  -- value_decimal
  NULL  -- value_float
`

export const jsonFields = sql`  
  id,
  document_version_id,
  collection_id,
  'richText',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  NULL,  -- numeric_value
  NULL,  -- boolean_value
  value, -- json_value
  NULL,  -- date_type
  NULL,  -- value_date
  NULL,  -- value_time
  NULL,  -- value_timestamp
  NULL,  -- value_timestamp_tz
  NULL,  -- file_id
  NULL,  -- filename
  NULL,  -- original_filename
  NULL,  -- mime_type
  NULL,  -- file_size
  NULL,  -- storage_provider
  NULL,  -- storage_path
  NULL,  -- storage_url
  NULL,  -- file_hash
  NULL,  -- image_width
  NULL,  -- image_height
  NULL,  -- image_format
  NULL,  -- processing_status
  NULL,  -- thumbnail_generated
  NULL,  -- target_document_id
  NULL,  -- target_collection_id
  NULL,  -- relationship_type
  NULL,  -- cascade_delete
  json_schema, -- json_schema
  object_keys, -- object_keys
  NULL,  -- number_type
  NULL,  -- value_integer
  NULL,  -- value_decimal
  NULL  -- value_float
`

export const relationFields = sql`
  id,
  document_version_id,
  collection_id,
  'relation',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  NULL,  -- numeric_value
  NULL,  -- boolean_value
  NULL,  -- json_value
  NULL,  -- date_type
  NULL,  -- value_date
  NULL,  -- value_time
  NULL,  -- value_timestamp
  NULL,  -- value_timestamp_tz
  NULL,  -- file_id
  NULL,  -- filename
  NULL,  -- original_filename
  NULL,  -- mime_type
  NULL,  -- file_size
  NULL,  -- storage_provider
  NULL,  -- storage_path
  NULL,  -- storage_url
  NULL,  -- file_hash
  NULL,  -- image_width
  NULL,  -- image_height
  NULL,  -- image_format
  NULL,  -- processing_status
  NULL,  -- thumbnail_generated
  target_document_id,  -- target_document_id
  target_collection_id, -- target_collection_id
  relationship_type,    -- relationship_type
  cascade_delete,       -- cascade_delete
  NULL,  -- json_schema
  NULL,  -- object_keys
  NULL,  -- number_type
  NULL,  -- value_integer
  NULL,  -- value_decimal
  NULL  -- value_float  
`
export const fileFields = sql`
  id,
  document_version_id,
  collection_id,
  'file',
  field_path,
  field_name,
  locale,
  parent_path,
  NULL,  -- text_value
  NULL,  -- numeric_value
  NULL,  -- boolean_value
  NULL,  -- json_value
  NULL,  -- date_type
  NULL,  -- value_date
  NULL,  -- value_time
  NULL,  -- value_timestamp
  NULL,  -- value_timestamp_tz
  file_id,           -- file_id
  filename,          -- filename
  original_filename, -- original_filename
  mime_type,         -- mime_type
  file_size,         -- file_size
  storage_provider,  -- storage_provider
  storage_path,      -- storage_path
  storage_url,       -- storage_url
  file_hash,         -- file_hash
  image_width,       -- image_width
  image_height,      -- image_height
  image_format,      -- image_format
  processing_status, -- processing_status
  thumbnail_generated, -- thumbnail_generated
  NULL,  -- target_document_id
  NULL,  -- target_collection_id
  NULL,  -- relationship_type
  NULL,  -- cascade_delete
  NULL,  -- json_schema
  NULL,  -- object_keys
  NULL,  -- number_type
  NULL,  -- value_integer
  NULL,  -- value_decimal
  NULL  -- value_float
`