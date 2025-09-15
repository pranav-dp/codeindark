import { NextRequest } from 'next/server'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'objectId'
  min?: number
  max?: number
  enum?: string[]
}

export function validateRequest(body: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    const value = body[rule.field]
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${rule.field} is required`
    }
    
    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) continue
    
    // Type validation
    if (rule.type === 'number' && (isNaN(value) || typeof value !== 'number')) {
      return `${rule.field} must be a number`
    }
    
    if (rule.type === 'string' && typeof value !== 'string') {
      return `${rule.field} must be a string`
    }
    
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${rule.field} must be a valid email`
    }
    
    // Range validation
    if (rule.min !== undefined && value < rule.min) {
      return `${rule.field} must be at least ${rule.min}`
    }
    
    if (rule.max !== undefined && value > rule.max) {
      return `${rule.field} must be at most ${rule.max}`
    }
    
    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum.join(', ')}`
    }
  }
  
  return null
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000) // Limit string length
  }
  if (typeof input === 'number') {
    return Math.max(-1000000, Math.min(1000000, input)) // Limit number range
  }
  return input
}
