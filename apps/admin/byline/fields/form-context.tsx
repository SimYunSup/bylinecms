import React, { createContext, useContext, useRef } from 'react'

interface FormContextType {
  setFieldValue: (name: string, value: any) => void
  getFieldValues: () => Record<string, any>
}

const FormContext = createContext<FormContextType | null>(null)

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  return context
}

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const fieldValues = useRef<Record<string, any>>({})

  const setFieldValue = (name: string, value: any) => {
    fieldValues.current[name] = value
  }

  const getFieldValues = () => fieldValues.current

  return (
    <FormContext.Provider value={{ setFieldValue, getFieldValues }}>
      {children}
    </FormContext.Provider>
  )
}
