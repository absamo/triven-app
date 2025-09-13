/**
 * Server-side geolocation utilities for IP-based location and network detection
 */

export interface DetailedLocation {
    country: string;
    countryCode: string;
    region: string;
    regionCode: string;
    city: string;
    postalCode: string;
    latitude: string;
    longitude: string;
    timezone: string;
    isp: string;
    organization: string;
}

export interface NetworkInfo {
    isp: string;
    organization: string;
    formatted: string;
}

export interface GeolocationResult {
    locationInfo: string;
    networkInfo: NetworkInfo;
    detailedLocation: DetailedLocation;
}

/**
 * Get detailed location and network information from IP address
 */
export async function getDetailedLocationInfo(clientIP: string): Promise<GeolocationResult> {
    const defaultResult: GeolocationResult = {
        locationInfo: "Unknown location",
        networkInfo: {
            isp: "Unknown",
            organization: "Unknown",
            formatted: "Unknown network"
        },
        detailedLocation: {
            country: "Unknown",
            countryCode: "Unknown",
            region: "Unknown",
            regionCode: "Unknown",
            city: "Unknown",
            postalCode: "Unknown",
            latitude: "Unknown",
            longitude: "Unknown",
            timezone: "Unknown",
            isp: "Unknown",
            organization: "Unknown"
        }
    }

    try {
        // First try with the detected IP if it's not localhost
        if (clientIP !== "Unknown" && !clientIP.startsWith("127.") && !clientIP.startsWith("::1") && clientIP !== "127.0.0.1 (localhost)") {
            return await fetchLocationData(`https://ipapi.co/${clientIP}/json/`, false)
        } else {
            // For localhost/development, get location based on server's public IP
            return await fetchLocationData('https://ipapi.co/json/', true)
        }
    } catch (geoError) {
        console.warn("Failed to get location info:", geoError)
        return {
            ...defaultResult,
            locationInfo: "Location detection failed",
            networkInfo: {
                ...defaultResult.networkInfo,
                formatted: "Network detection failed"
            }
        }
    }
}

/**
 * Fetch and parse location data from ipapi.co
 */
async function fetchLocationData(url: string, isServerLocation: boolean): Promise<GeolocationResult> {
    const geoResponse = await fetch(url, {
        headers: {
            'User-Agent': 'Triven-ERP/1.0'
        }
    })

    if (!geoResponse.ok) {
        throw new Error(`Geolocation API failed with status: ${geoResponse.status}`)
    }

    const geoData = await geoResponse.json()

    return parseGeolocationData(geoData, isServerLocation)
}

/**
 * Parse geolocation API response into structured data
 */
function parseGeolocationData(geoData: any, isServerLocation: boolean): GeolocationResult {
    const serverSuffix = isServerLocation ? " (Server)" : ""
    const locationSuffix = isServerLocation ? " (Server Location)" : ""
    const networkSuffix = isServerLocation ? " (Server Network)" : ""

    // Basic location info for backward compatibility
    let locationInfo = "Unknown location"
    if (geoData.city && geoData.region && geoData.country_name) {
        locationInfo = `${geoData.city}, ${geoData.region}, ${geoData.country_name}${locationSuffix}`
    }

    // Network information
    const isp = geoData.org || geoData.isp || "Unknown"
    const organization = geoData.org || "Unknown"
    const networkInfo: NetworkInfo = {
        isp: isServerLocation ? `${isp}${serverSuffix}` : isp,
        organization: isServerLocation ? `${organization}${serverSuffix}` : organization,
        formatted: `ISP: ${isp}${networkSuffix}`
    }

    // Detailed location information
    const detailedLocation: DetailedLocation = {
        country: geoData.country_name ? `${geoData.country_name}${locationSuffix}` : "Unknown",
        countryCode: geoData.country_code || "Unknown",
        region: geoData.region ? `${geoData.region}${serverSuffix}` : "Unknown",
        regionCode: geoData.region_code || "Unknown",
        city: geoData.city ? `${geoData.city}${serverSuffix}` : "Unknown",
        postalCode: geoData.postal || "Unknown",
        latitude: geoData.latitude ? `${geoData.latitude}°N` : "Unknown",
        longitude: geoData.longitude ? `${geoData.longitude}°E` : "Unknown",
        timezone: geoData.timezone || "Unknown",
        isp: isServerLocation ? `${isp}${serverSuffix}` : isp,
        organization: isServerLocation ? `${organization}${serverSuffix}` : organization
    }

    return {
        locationInfo,
        networkInfo,
        detailedLocation
    }
}

/**
 * Get client IP address with fallback strategies
 */
export async function getClientIP(request: Request): Promise<string> {
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const cfIP = request.headers.get("cf-connecting-ip")

    let clientIP = "Unknown"

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, get the first one
        clientIP = forwarded.split(',')[0].trim()
    } else if (realIP) {
        clientIP = realIP
    } else if (cfIP) {
        clientIP = cfIP
    } else {
        // For development, try to get a public IP
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json')
            if (ipResponse.ok) {
                const ipData = await ipResponse.json()
                clientIP = ipData.ip || "Unknown"
            }
        } catch {
            clientIP = "127.0.0.1 (localhost)"
        }
    }

    return clientIP
}
