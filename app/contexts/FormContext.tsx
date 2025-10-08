import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

interface FormContextType {
  isFormActive: boolean
  setIsFormActive: (active: boolean) => void
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  isSubmitting: boolean
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  return context
}

interface FormProviderProps {
  children: ReactNode
  isFormActive: boolean
  setIsFormActive: (active: boolean) => void
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  isSubmitting: boolean
}

export const FormProvider = ({
  children,
  isFormActive,
  setIsFormActive,
  onSubmit,
  isSubmitting,
}: FormProviderProps) => {
  return (
    <FormContext.Provider
      value={{
        isFormActive,
        setIsFormActive,
        onSubmit,
        isSubmitting,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}
