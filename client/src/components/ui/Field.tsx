import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react'

interface BaseFieldProps {
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
}

export const Field = ({ id, label, hint, error, required, children }: BaseFieldProps & { id: string; children: ReactNode }) => (
  <div>
    {label && (
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="field-error" id={`${id}-error`}>
        {error}
      </p>
    ) : hint ? (
      <p className="hint" id={`${id}-hint`}>
        {hint}
      </p>
    ) : null}
  </div>
)

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ error, className = '', ...props }, ref) => (
  <input ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />
))
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ error, className = '', ...props }, ref) => (
  <textarea ref={ref} className={`input min-h-24 resize-y ${error ? 'input-error' : ''} ${className}`} {...props} />
))
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ error, className = '', children, ...props }, ref) => (
  <select ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'