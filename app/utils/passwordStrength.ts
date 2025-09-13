export interface PasswordChecks {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    numbers: boolean
    special: boolean
}

export interface PasswordStrengthResult {
    strength: number
    checks: PasswordChecks
}

/**
 * Calculate password strength based on various criteria
 * @param password The password to check
 * @returns Object containing strength score (0-100) and individual checks
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
    let strength = 0
    const checks: PasswordChecks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    // Count how many requirements are met
    const requirementsMet = Object.values(checks).filter(Boolean).length

    // Only calculate strength based on actual requirements met
    // All 5 requirements must be met to get to "Good" level (60%+)
    if (requirementsMet === 5) {
        strength = 100 // Very Strong - all requirements met
    } else if (requirementsMet === 4) {
        strength = 50 // Still weak until all requirements are met
    } else if (requirementsMet === 3) {
        strength = 30 // Weak
    } else if (requirementsMet === 2) {
        strength = 20 // Weak
    } else if (requirementsMet === 1) {
        strength = 10 // Weak
    } else {
        strength = 0 // Very weak
    }

    return { strength, checks }
}

/**
 * Get the color for password strength indicator
 * @param strength The strength score (0-100)
 * @returns Mantine color name
 */
export function getPasswordStrengthColor(strength: number): string {
    if (strength < 40) return 'red'
    if (strength < 60) return 'orange'
    if (strength < 80) return 'yellow'
    if (strength < 100) return 'green'
    return 'teal'
}

/**
 * Get the localized label for password strength
 * @param strength The strength score (0-100)
 * @param t Translation function
 * @returns Localized strength label
 */
export function getPasswordStrengthLabel(strength: number, t: any): string {
    if (strength < 40) return t('auth:weak')
    if (strength < 60) return t('auth:fair')
    if (strength < 80) return t('auth:good')
    if (strength < 100) return t('auth:strong')
    return t('auth:veryStrong')
}
