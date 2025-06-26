/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type React from 'react'
import { createContext, useContext, useRef } from 'react'

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
