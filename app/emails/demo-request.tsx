import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text
} from '@react-email/components';

interface DemoRequestEmailProps {
    name?: string;
    workEmail?: string;
    companyName?: string;
    phoneNumber?: string;
    companySize?: string;
    preferredDate?: string;
    preferredTime?: string;
    timezone?: string;
    message?: string;
    submittedAt?: string;
    clientIP?: string;
    userAgent?: string;
    locationInfo?: string;
    networkInfo?: string;
    detailedLocation?: {
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
    };
}

export default function DemoRequestEmail({
    name = '',
    workEmail = '',
    companyName = '',
    phoneNumber = '',
    companySize = '',
    preferredDate = '',
    preferredTime = '',
    timezone = '',
    message = '',
    submittedAt = new Date().toISOString(),
    clientIP = 'Unknown',
    userAgent = 'Unknown',
    locationInfo = 'Unknown location',
    networkInfo = 'Unknown network',
    detailedLocation = {
        country: 'Unknown',
        countryCode: 'Unknown',
        region: 'Unknown',
        regionCode: 'Unknown',
        city: 'Unknown',
        postalCode: 'Unknown',
        latitude: 'Unknown',
        longitude: 'Unknown',
        timezone: 'Unknown',
        isp: 'Unknown',
        organization: 'Unknown'
    },
}: DemoRequestEmailProps) {
    // Helper function to get country flag emoji
    const getCountryFlag = (countryCode: string): string => {
        if (!countryCode || countryCode === 'Unknown') return '🌍'

        const flagMap: Record<string, string> = {
            'FR': '🇫🇷', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹',
            'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷',
            'RU': '🇷🇺', 'MX': '🇲🇽', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹',
            'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'IE': '🇮🇪',
            'PT': '🇵🇹', 'GR': '🇬🇷', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'SK': '🇸🇰', 'RO': '🇷🇴',
            'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪',
            'CY': '🇨🇾', 'MT': '🇲🇹', 'LU': '🇱🇺', 'IS': '🇮🇸', 'LI': '🇱🇮', 'MC': '🇲🇨',
            'AD': '🇦🇩', 'SM': '🇸🇲', 'VA': '🇻🇦', 'KR': '🇰🇷', 'TH': '🇹🇭', 'VN': '🇻🇳',
            'SG': '🇸🇬', 'MY': '🇲🇾', 'ID': '🇮🇩', 'PH': '🇵🇭', 'TW': '🇹🇼', 'HK': '🇭🇰',
            'MO': '🇲🇴', 'NZ': '🇳🇿', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'MA': '🇲🇦', 'TN': '🇹🇳',
            'DZ': '🇩🇿', 'LY': '🇱🇾', 'SD': '🇸🇩', 'ET': '🇪🇹', 'KE': '🇰🇪', 'UG': '🇺🇬',
            'TZ': '🇹🇿', 'RW': '🇷🇼', 'BI': '🇧🇮', 'DJ': '🇩🇯', 'SO': '🇸🇴', 'ER': '🇪🇷',
            'SS': '🇸🇸', 'CF': '🇨🇫', 'TD': '🇹🇩', 'CM': '🇨🇲', 'GQ': '🇬🇶', 'GA': '🇬🇦',
            'CG': '🇨🇬', 'CD': '🇨🇩', 'AO': '🇦🇴', 'ZM': '🇿🇲', 'ZW': '🇿🇼', 'BW': '🇧🇼',
            'NA': '🇳🇦', 'SZ': '🇸🇿', 'LS': '🇱🇸', 'MW': '🇲🇼', 'MZ': '🇲🇿', 'MG': '🇲🇬',
            'MU': '🇲🇺', 'SC': '🇸🇨', 'KM': '🇰🇲', 'YT': '🇾🇹', 'RE': '🇷🇪', 'SH': '🇸🇭',
            'ST': '🇸🇹', 'CV': '🇨🇻', 'GW': '🇬🇼', 'GN': '🇬🇳', 'SL': '🇸🇱', 'LR': '🇱🇷',
            'CI': '🇨🇮', 'GH': '🇬🇭', 'TG': '🇹🇬', 'BJ': '🇧🇯', 'NE': '🇳🇪', 'BF': '🇧🇫',
            'ML': '🇲🇱', 'SN': '🇸🇳', 'GM': '🇬🇲', 'GU': '🇬🇺', 'MR': '🇲🇷', 'EH': '🇪🇭',
            'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪', 'BO': '🇧🇴', 'PY': '🇵🇾', 'UY': '🇺🇾',
            'EC': '🇪🇨', 'CO': '🇨🇴', 'VE': '🇻🇪', 'GY': '🇬🇾', 'SR': '🇸🇷', 'GF': '🇬🇫',
            'FK': '🇫🇰', 'GS': '🇬🇸', 'TK': '🇹🇰', 'TV': '🇹🇻', 'NR': '🇳🇷', 'KI': '🇰🇮',
            'MH': '🇲🇭', 'FM': '🇫🇲', 'PW': '🇵🇼', 'WS': '🇼🇸', 'TO': '🇹🇴', 'FJ': '🇫🇯',
            'VU': '🇻🇺', 'SB': '🇸🇧', 'PG': '🇵🇬', 'NC': '🇳🇨', 'NF': '🇳🇫', 'CX': '🇨🇽',
            'CC': '🇨🇨', 'HM': '🇭🇲', 'AQ': '🇦🇶'
        }

        return flagMap[countryCode.toUpperCase()] || '🌍'
    }

    // Simple user agent parsing function
    const parseUserAgent = (ua: string): string => {
        if (!ua || ua === 'Unknown') return 'Unknown'

        // Extract browser
        let browser = 'Unknown Browser'
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
        else if (ua.includes('Firefox')) browser = 'Firefox'
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
        else if (ua.includes('Edg')) browser = 'Edge'
        else if (ua.includes('Opera')) browser = 'Opera'

        // Extract OS
        let os = 'Unknown OS'
        if (ua.includes('Windows NT')) os = 'Windows'
        else if (ua.includes('Mac OS X')) os = 'macOS'
        else if (ua.includes('Linux')) os = 'Linux'
        else if (ua.includes('Android')) os = 'Android'
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

        return `${browser} on ${os}`
    }

    return (
        <Html lang="en">
            <Head />
            <Preview>New Demo Request from {name} at {companyName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={logoSection}>
                        <Img
                            src={`${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/assets/triven-logo.png`}
                            width="170"
                            height="50"
                            alt="TRIVEN"
                            style={logo}
                        />
                    </Section>

                    <Section style={section}>
                        <Text style={title}>New Triven Demo Request</Text>
                        <Text style={text}>
                            A new demo request has been submitted through the Triven website.
                        </Text>

                        <Hr style={hr} />

                        <Text style={fieldLabel}>Contact Information:</Text>
                        <Text style={fieldValue}>Name: {name}</Text>
                        <Text style={fieldValue}>Email: {workEmail}</Text>
                        <Text style={fieldValue}>Phone: {phoneNumber}</Text>

                        <Text style={fieldLabel}>Company Information:</Text>
                        <Text style={fieldValue}>Company: {companyName}</Text>
                        <Text style={fieldValue}>Company Size: {companySize}</Text>

                        <Text style={fieldLabel}>Demo Scheduling:</Text>
                        <Text style={fieldValue}>Preferred Date: {preferredDate ? new Date(preferredDate).toLocaleDateString() : 'Not specified'}</Text>
                        <Text style={fieldValue}>Preferred Time: {preferredTime || 'Not specified'}</Text>
                        <Text style={fieldValue}>Client Timezone: {timezone || 'Not specified'}</Text>

                        {message && message.trim() !== 'No message provided' && (
                            <>
                                <Text style={fieldLabel}>Additional Message:</Text>
                                <Text style={messageStyle}>{message}</Text>
                            </>
                        )}

                        <Hr style={hr} />

                        <Text style={fieldLabel}>Technical Information:</Text>
                        <Text style={fieldValue}>IP Address: {clientIP}</Text>
                        <Text style={fieldValue}>Browser/OS: {parseUserAgent(userAgent)}</Text>

                        <Text style={fieldLabel}>Network Information:</Text>
                        <Text style={fieldValue}>• ISP: {detailedLocation.isp}</Text>
                        {detailedLocation.organization && detailedLocation.organization !== detailedLocation.isp && (
                            <Text style={fieldValue}>• Organization: {detailedLocation.organization}</Text>
                        )}

                        <Text style={fieldLabel}>Location Details:</Text>
                        <Text style={fieldValue}>• Country: {detailedLocation.country} {getCountryFlag(detailedLocation.countryCode)}</Text>
                        <Text style={fieldValue}>• Region: {detailedLocation.region} ({detailedLocation.regionCode})</Text>
                        <Text style={fieldValue}>• City: {detailedLocation.city}</Text>
                        {detailedLocation.postalCode && detailedLocation.postalCode !== 'Unknown' && (
                            <Text style={fieldValue}>• Postal Code: {detailedLocation.postalCode}</Text>
                        )}
                        {detailedLocation.latitude !== 'Unknown' && detailedLocation.longitude !== 'Unknown' && (
                            <Text style={fieldValue}>• Coordinates: {detailedLocation.latitude}, {detailedLocation.longitude}</Text>
                        )}
                        {detailedLocation.timezone && detailedLocation.timezone !== 'Unknown' && (
                            <Text style={fieldValue}>• Timezone: {detailedLocation.timezone}</Text>
                        )}

                        <Hr style={hr} />

                        <Text style={footer}>
                            Submitted at: {new Date(submittedAt).toLocaleString()}
                        </Text>

                        <Text style={footer}>
                            Please follow up with this prospect as soon as possible.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const logoSection = {
    padding: '32px 40px',
    textAlign: 'center' as const,
};

const logo = {
    margin: '0 auto',
};

const section = {
    padding: '0 40px',
};

const title = {
    fontSize: '21px',
    lineHeight: '1.3',
    fontWeight: '600',
    color: '#484848',
    padding: '17px 0 0',
};

const text = {
    margin: '0 0 10px 0',
    textAlign: 'left' as const,
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#3c4149',
};

const fieldLabel = {
    margin: '20px 0 8px 0',
    textAlign: 'left' as const,
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#8898aa',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};

const fieldValue = {
    margin: '0 0 8px 0',
    textAlign: 'left' as const,
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#3c4149',
    paddingLeft: '16px',
};

const messageStyle = {
    margin: '0 0 10px 0',
    textAlign: 'left' as const,
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#3c4149',
    paddingLeft: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
};

const hr = {
    borderColor: '#dfe1e4',
    margin: '42px 0 26px',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '1.4',
    margin: '0 0 10px 0',
};
