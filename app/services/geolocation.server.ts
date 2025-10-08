interface GeolocationData {
  country?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  timezone?: string
  ip?: string
}

interface IPGeolocationResponse {
  country_name?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  timezone?: string
  ip?: string
}

/**
 * Get user location data from IP address using ipapi.co
 * This is a free service with 1000 requests per day limit
 */
export async function getLocationFromIP(request: Request): Promise<GeolocationData> {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = forwarded?.split(',')[0] || realIP || 'unknown'

    // Skip for localhost/development
    if (
      clientIP === 'unknown' ||
      clientIP.includes('127.0.0.1') ||
      clientIP.includes('localhost')
    ) {
      return {
        country: 'France', // Default for development
        city: 'Paris',
        region: 'Île-de-France',
      }
    }

    // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${clientIP}/json/`, {
      headers: {
        'User-Agent': 'Triven-ERP/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: IPGeolocationResponse = await response.json()

    return {
      country: data.country_name,
      city: data.city,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      ip: clientIP,
    }
  } catch (error) {
    // Fallback to France/Paris for errors
    return {
      country: 'France',
      city: 'Paris',
      region: 'Île-de-France',
    }
  }
}

/**
 * Alternative IP geolocation service using ip-api.com
 * Free tier: 45 requests per minute, no API key required
 */
export async function getLocationFromIPAlternative(request: Request): Promise<GeolocationData> {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = forwarded?.split(',')[0] || realIP || 'unknown'

    // Skip for localhost/development
    if (
      clientIP === 'unknown' ||
      clientIP.includes('127.0.0.1') ||
      clientIP.includes('localhost')
    ) {
      return {
        country: 'France',
        city: 'Paris',
        region: 'Île-de-France',
      }
    }

    // Use ip-api.com for IP geolocation
    const response = await fetch(
      `http://ip-api.com/json/${clientIP}?fields=status,country,regionName,city,lat,lon,timezone,query`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'fail') {
      throw new Error('IP geolocation service failed')
    }

    return {
      country: data.country,
      city: data.city,
      region: data.regionName,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      ip: data.query,
    }
  } catch (error) {
    // Fallback to France/Paris for errors
    return {
      country: 'France',
      city: 'Paris',
      region: 'Île-de-France',
    }
  }
}

/**
 * Get user location with fallback strategy
 * First tries ipapi.co, then falls back to ip-api.com
 */
export async function getUserLocation(request: Request): Promise<GeolocationData> {
  try {
    // Try primary service first
    const location = await getLocationFromIP(request)

    // If primary service didn't return valid data, try alternative
    if (!location.country || !location.city) {
      return await getLocationFromIPAlternative(request)
    }

    return location
  } catch (error) {
    // Final fallback
    return {
      country: 'France',
      city: 'Paris',
      region: 'Île-de-France',
    }
  }
}

/**
 * Client-side geolocation detection utility
 * This can be used in the browser to get more accurate location
 */
export const clientGeolocation = {
  /**
   * Get user's current position using browser Geolocation API
   */
  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      })
    })
  },

  /**
   * Reverse geocode coordinates to get city/country information
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeolocationData> {
    try {
      // Using OpenStreetMap Nominatim service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Triven-ERP/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return {
        country: data.address?.country,
        city: data.address?.city || data.address?.town || data.address?.village,
        region: data.address?.state || data.address?.region,
        latitude,
        longitude,
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Get user location using browser geolocation with reverse geocoding
   */
  async getBrowserLocation(): Promise<GeolocationData> {
    try {
      const position = await this.getCurrentPosition()
      const { latitude, longitude } = position.coords

      return await this.reverseGeocode(latitude, longitude)
    } catch (error) {
      throw error
    }
  },
}
