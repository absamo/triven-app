// Landing Page Types
// Generated for Feature: Landing Page Redesign (003-landing-page-redesign)

export interface LandingPageConfig {
  id: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string | null
  defaultTheme: string
  showCompanyLogos: boolean
  enableDemoRequests: boolean
  enableTrialSignup: boolean
  demoRequestRateLimit: number
  createdAt: Date
  updatedAt: Date
}

export interface Testimonial {
  id: string
  customerName: string
  role: string
  company: string
  photoUrl: string | null
  testimonialText: string
  starRating: number
  displayOrder: number
  isPlaceholder: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SuccessMetric {
  id: string
  label: string
  value: string
  icon: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DemoRequest {
  id: string
  name: string
  email: string
  company: string
  teamSize: string
  preferredDemoTime: Date | null
  message: string | null
  status: string
  notificationSent: boolean
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

export type DemoRequestStatus = 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'

export interface CTAButton {
  id: string
  buttonText: string
  buttonType: 'primary' | 'secondary'
  destinationUrl: string
  trackingIdentifier: string
  position: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Form data types for client-side
export interface DemoRequestFormData {
  name: string
  email: string
  company?: string
  teamSize?: string
  preferredDemoTime?: string
  message?: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

export interface DemoRequestResponse {
  success: boolean
  message: string
  demoRequest?: DemoRequest
}

export interface TestimonialsResponse {
  testimonials: Testimonial[]
}

export interface SuccessMetricsResponse {
  metrics: SuccessMetric[]
}

export interface LandingConfigResponse {
  config: LandingPageConfig
}

// Dashboard preview types (for hero section)
export interface DashboardMetrics {
  totalInventoryValue: number
  itemsTracked: number
  accuracyRate: number
  growthPercentage: number
}
