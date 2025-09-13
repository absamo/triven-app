interface GeolocationData {
    country?: string
    city?: string
    region?: string
    latitude?: number
    longitude?: number
    timezone?: string
    ip?: string
}

/**
 * Client-side geolocation utilities for browser-based location detection
 */
export class ClientGeolocation {



    /**
     * Get user location from IP using a client-side IP geolocation service
     */
    static async getLocationFromIP(): Promise<GeolocationData> {
        try {
            // Using ipapi.co for client-side IP geolocation
            const response = await fetch('https://ipapi.co/json/', {
                headers: {
                    'User-Agent': 'Triven-ERP/1.0'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            return {
                country: data.country_name,
                city: data.city,
                region: data.region,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                ip: data.ip
            }
        } catch (error) {
            console.error('Client-side IP geolocation failed:', error)
            throw error
        }
    }

    /**
     * Get user location with multiple fallback strategies
     * 1. Try browser geolocation (most accurate)
     * 2. Fall back to IP geolocation
     * 3. Return default location
     */
    static async getUserLocation(): Promise<GeolocationData> {
        try {


            // Fall back to IP geolocation
            const ipLocation = await this.getLocationFromIP()
            if (ipLocation.country && ipLocation.city) {
                return ipLocation
            }

            throw new Error('All geolocation methods failed')
        } catch (error) {
            console.error('All client-side geolocation methods failed:', error)

            // Final fallback
            return {
                country: 'France',
                city: 'Paris',
                region: 'Île-de-France'
            }
        }
    }


    /**
     * Request permission for geolocation (doesn't work in all browsers)
     */
    static async requestPermission(): Promise<PermissionState> {
        if ('permissions' in navigator) {
            const permission = await navigator.permissions.query({ name: 'geolocation' })
            return permission.state
        }
        return 'prompt'
    }
}

/**
 * React hook for geolocation
 */
export function useGeolocation() {
    const [location, setLocation] = useState<GeolocationData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getLocation = async () => {
        setLoading(true)
        setError(null)

        try {
            const locationData = await ClientGeolocation.getUserLocation()
            setLocation(locationData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get location')
        } finally {
            setLoading(false)
        }
    }

    return {
        location,
        loading,
        error,
        getLocation
    }
}

// Need to import useState
import { useState } from 'react'
