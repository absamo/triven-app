import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

/**
 * Generic PDF Layout Component
 * 
 * A reusable PDF layout that provides consistent header, footer, and page structure
 * for all PDF documents in the application.
 * 
 * Usage Example:
 * ```tsx
 * <PDFLayout
 *   header={{
 *     title: "Sales Report",
 *     subtitle: "Generated on 2025-06-15",
 *     additionalContent: <SomeCustomContent />
 *   }}
 *   footerPrefix="My Company Name"
 *   pageSize="A4"
 * >
 *   <YourCustomContent />
 * </PDFLayout>
 * ```
 */

// Generic PDF styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        paddingBottom: 50,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1a202c',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 20,
    },
    content: {
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
    },
});

interface PDFHeaderProps {
    title: string;
    subtitle?: string;
    additionalContent?: ReactNode;
}

interface PDFLayoutProps {
    header: PDFHeaderProps;
    children: ReactNode;
    footerPrefix?: string;
    pageSize?: 'A4' | 'LETTER';
}

// Generic PDF Header component
const PDFHeader = ({ title, subtitle, additionalContent }: PDFHeaderProps) => (
    <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {additionalContent}
    </View>
);

// Generic PDF Footer component
const PDFFooter = ({ prefix = '' }: { prefix?: string }) => (
    <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
            prefix ? `${prefix} | Page ${pageNumber} of ${totalPages}` : `Page ${pageNumber} of ${totalPages}`
        }
        fixed
    />
);

// Generic PDF Layout component
const PDFLayout = ({
    header,
    children,
    footerPrefix = '',
    pageSize = 'A4'
}: PDFLayoutProps) => {
    return (
        <Document>
            <Page size={pageSize} style={styles.page}>
                <PDFHeader {...header} />
                <View style={styles.content}>
                    {children}
                </View>
                <PDFFooter prefix={footerPrefix} />
            </Page>
        </Document>
    );
};

export default PDFLayout;
export { PDFFooter, PDFHeader, styles as pdfLayoutStyles };
export type { PDFHeaderProps, PDFLayoutProps };

