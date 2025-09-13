# Zod Validation Implementation for WorkflowTemplateForm

## Overview
The WorkflowTemplateForm now includes comprehensive Zod validation with the following features:

## 1. Validation Schema (`validation.ts`)

### WorkflowStep Schema
```typescript
export const workflowStepSchema = z.object({
    id: z.string().min(1, "Step ID is required"),
    name: z.string().min(1, "Step name is required").max(100, "Step name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    type: z.enum(['approval', 'review', 'notification', ...]).describe("Please select a valid step type"),
    assigneeType: z.enum(['user', 'role', 'creator', 'manager', 'department_head']).describe("Please select a valid assignee type"),
    assigneeId: z.string(),
    assigneeName: z.string(),
    order: z.number().int().min(1, "Order must be at least 1"),
    isRequired: z.boolean(),
    timeoutDays: z.number().int().min(1, "Timeout must be at least 1 day").max(365, "Timeout cannot exceed 365 days").optional(),
    autoApprove: z.boolean().optional(),
    allowParallel: z.boolean().optional(),
    conditions: z.record(z.string(), z.any()).optional()
})
```

### WorkflowTemplate Schema
```typescript
export const workflowTemplateSchema = z.object({
    name: z.string()
        .min(1, "Template name is required")
        .max(100, "Template name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "Template name can only contain letters, numbers, spaces, hyphens, and underscores"),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    entityType: z.enum(['purchase_order', 'sales_order', ...]).describe("Please select a valid entity type"),
    priority: z.enum(['Low', 'Medium', 'High']).describe("Please select a valid priority"),
    isActive: z.boolean(),
    steps: z.array(workflowStepSchema)
        .min(1, "At least one workflow step is required")
        .max(20, "Cannot exceed 20 workflow steps")
        .refine((steps) => {
            // Check for unique step orders
            const orders = steps.map(step => step.order)
            const uniqueOrders = new Set(orders)
            return orders.length === uniqueOrders.size
        }, { message: "Step orders must be unique" })
        .refine((steps) => {
            // Check for unique step names
            const names = steps.map(step => step.name.trim().toLowerCase())
            const uniqueNames = new Set(names)
            return names.length === uniqueNames.size
        }, { message: "Step names must be unique" })
})
```

## 2. Validation Features

### Real-time Field Validation
- **Template Name**: Validates format, length, and required characters
- **Step Names**: Ensures uniqueness and proper length
- **Timeout Days**: Validates numeric range (1-365 days)
- **Error Display**: Shows errors immediately below fields

### Form-level Validation
- **Comprehensive Validation**: Validates entire form on submit
- **Business Rules**: Custom validation for assignee requirements and conditional logic
- **Error Aggregation**: Shows multiple validation errors in a summary panel

### Custom Validation Functions
```typescript
// Field-specific validation
export const validateTemplateName = (name: string) => { ... }
export const validateStepName = (name: string) => { ... }
export const validateTimeout = (days: number) => { ... }

// Business rule validation
export const validateAssigneeRequirements = (step: Partial<WorkflowStepFormData>) => { ... }
export const validateConditionalLogic = (step: Partial<WorkflowStepFormData>) => { ... }
```

## 3. UI Integration

### Error Display
1. **Field-level Errors**: Individual field validation messages
2. **Validation Summary**: Panel showing all current validation errors
3. **Notification Errors**: Toast notifications for form submission errors

### Real-time Validation
```typescript
const validateField = (fieldName: string, value: any) => {
    switch (fieldName) {
        case 'name':
            const nameResult = validateTemplateName(value)
            if (!nameResult.success) {
                setValidationErrors(prev => ({
                    ...prev,
                    [fieldName]: nameResult.error.issues[0].message
                }))
            }
            break
        // ... other cases
    }
}
```

### Form Submission Validation
```typescript
const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    // Validate the entire form using Zod
    const validationResult = validateWorkflowTemplate(formData)
    
    if (!validationResult.success) {
        // Display comprehensive validation errors
        const errorMessage = formatValidationErrors(validationResult.error)
        notifications.show({
            title: 'Validation Error',
            message: errorMessage,
            color: 'red',
            autoClose: 8000,
        })
        return
    }
    
    // Additional custom validations for complex business rules
    for (const step of formData.steps) {
        const assigneeValidation = validateAssigneeRequirements(step)
        const conditionalValidation = validateConditionalLogic(step)
        // Handle validation results...
    }
    
    // Proceed with form submission...
}
```

## 4. Key Benefits

### Type Safety
- **TypeScript Integration**: Inferred types from Zod schemas
- **Compile-time Safety**: Catch validation errors during development
- **Auto-completion**: Better IDE support for form data

### User Experience
- **Immediate Feedback**: Real-time validation as users type
- **Clear Error Messages**: Specific, actionable error messages
- **Visual Indicators**: Error highlighting and summary panels

### Maintainability
- **Centralized Validation**: All rules in one place
- **Reusable Validators**: Field-specific validation functions
- **Business Rule Separation**: Custom validation for complex requirements

## 5. Usage Examples

### Adding New Validation Rules
```typescript
// Add to validation.ts
const customRule = z.string().refine((value) => {
    return value.includes('required-text')
}, { message: "Value must contain 'required-text'" })

// Use in component
const validateCustomField = (value: string) => {
    const result = customRule.safeParse(value)
    if (!result.success) {
        setValidationErrors(prev => ({
            ...prev,
            customField: result.error.issues[0].message
        }))
    }
}
```

### Extending Business Rules
```typescript
// Add to validation.ts
export const validateBusinessRule = (data: FormData) => {
    if (data.entityType === 'purchase_order' && data.steps.length < 2) {
        return {
            success: false,
            error: { message: "Purchase orders require at least 2 approval steps" }
        }
    }
    return { success: true }
}
```

## 6. Testing Validation

The validation can be tested independently:

```typescript
import { validateWorkflowTemplate, validateWorkflowStep } from './validation'

// Test valid data
const validTemplate = {
    name: "Test Template",
    entityType: "purchase_order",
    priority: "Medium",
    isActive: true,
    steps: [/* valid steps */]
}
const result = validateWorkflowTemplate(validTemplate)


// Test invalid data
const invalidTemplate = {
    name: "", // Invalid: empty name
    entityType: "invalid_type", // Invalid: not in enum
    steps: [] // Invalid: no steps
}
const errorResult = validateWorkflowTemplate(invalidTemplate)
```

This comprehensive validation system ensures data integrity, provides excellent user experience, and maintains code quality through type safety and centralized validation logic.