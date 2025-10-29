// Landing Page Configuration Service
// Service-Oriented Architecture (Constitutional Principle I)
// Standalone functions for landing page configuration operations

import { prisma } from '~/app/db.server'
import type { LandingPageConfig } from '~/app/lib/landing/types'

/**
 * Get landing page configuration (singleton)
 * Creates default config if none exists
 * @returns Landing page configuration
 */
export async function getLandingPageConfig(): Promise<LandingPageConfig> {
  let config = await prisma.landingPageConfig.findFirst()

  // Create default config if none exists
  if (!config) {
    config = await prisma.landingPageConfig.create({
      data: {
        metaTitle: 'Triven - AI-Powered Inventory Management',
        metaDescription:
          'Transform inventory chaos into intelligent business growth with Triven. Real-time visibility, AI-powered insights, and automated workflows for modern businesses.',
        metaKeywords:
          'inventory management, AI inventory, warehouse management, stock management, inventory software, real-time inventory, inventory tracking',
        defaultTheme: 'dark',
        showCompanyLogos: false,
      },
    })
  }

  return config
}

/**
 * Update landing page configuration
 * @param data - Partial landing page config data to update
 * @returns Updated landing page configuration
 */
export async function updateLandingPageConfig(
  data: Partial<{
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    defaultTheme: string
    showCompanyLogos: boolean
  }>
): Promise<LandingPageConfig> {
  // Get existing config or create if none exists
  let config = await prisma.landingPageConfig.findFirst()

  if (!config) {
    // Create with provided data merged with defaults
    config = await prisma.landingPageConfig.create({
      data: {
        metaTitle: data.metaTitle || 'Triven - AI-Powered Inventory Management',
        metaDescription:
          data.metaDescription ||
          'Transform inventory chaos into intelligent business growth with Triven.',
        metaKeywords: data.metaKeywords || 'inventory management, AI inventory',
        defaultTheme: data.defaultTheme || 'dark',
        showCompanyLogos: data.showCompanyLogos ?? false,
      },
    })
  } else {
    // Update existing config
    config = await prisma.landingPageConfig.update({
      where: { id: config.id },
      data,
    })
  }

  return config
}

/**
 * Toggle company logos visibility
 * @param visible - New visibility status
 * @returns Updated landing page configuration
 */
export async function toggleCompanyLogosVisibility(visible: boolean): Promise<LandingPageConfig> {
  const config = await getLandingPageConfig()

  const updatedConfig = await prisma.landingPageConfig.update({
    where: { id: config.id },
    data: { showCompanyLogos: visible },
  })

  return updatedConfig
}

/**
 * Set landing page theme
 * @param theme - Theme to set ('dark' or 'light')
 * @returns Updated landing page configuration
 */
export async function setLandingPageTheme(theme: 'dark' | 'light'): Promise<LandingPageConfig> {
  const config = await getLandingPageConfig()

  const updatedConfig = await prisma.landingPageConfig.update({
    where: { id: config.id },
    data: { defaultTheme: theme },
  })

  return updatedConfig
}
