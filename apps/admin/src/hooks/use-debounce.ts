import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T | undefined, delay: number): T | undefined {
  const [debouncedValue, setDebouncedValue] = useState<T | undefined>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
