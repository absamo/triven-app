import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components"

interface TeamInviteEmailProps {
    invitedUserName: string
    invitedByUserName: string
    invitedByEmail: string
    companyName: string
    inviteToken: string
    baseUrl?: string
}

export const TeamInviteEmail = ({
    invitedUserName,
    invitedByUserName,
    invitedByEmail,
    companyName,
    inviteToken,
    baseUrl = process.env.BASE_URL || "http://localhost:3000",
}: TeamInviteEmailProps) => {
    const previewText = `${invitedByUserName} invited you to join ${companyName} on Triven`
    const signupUrl = `${baseUrl}/invite?invite=${inviteToken}`

    return (
        <Html lang="en">
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={logoSection}>
                        <Img
                            src={`${baseUrl}/assets/triven-logo.png`}
                            width="170"
                            height="50"
                            alt="Triven"
                            style={logo}
                        />
                    </Section>

                    <Section style={section}>
                        <Text style={title}>You're invited to join {companyName}</Text>
                        <Text style={text}>
                            Hi {invitedUserName},
                        </Text>
                        <Text style={text}>
                            <strong>{invitedByUserName}</strong> ({" "}
                            <Link
                                href={`mailto:${invitedByEmail}`}
                                style={link}
                            >
                                {invitedByEmail}
                            </Link>
                            ) has invited you to join <strong>{companyName}</strong> on Triven.
                        </Text>

                        <Text style={text}>
                            Triven is a comprehensive inventory management solution that helps teams streamline their operations, track inventory, and manage orders efficiently.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={signupUrl}>
                                Join Team
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        <Text style={footer}>
                            This invitation was sent to you by {invitedByUserName}. If you don't recognize this invitation or believe it was sent in error, you can safely ignore this email.
                        </Text>

                        <Text style={footer}>
                            The invitation link will expire in 7 days for security reasons.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
}

const logoSection = {
    padding: '32px 40px',
    textAlign: 'center' as const,
}

const logo = {
    margin: '0 auto',
}

const section = {
    padding: '0 40px',
}

const title = {
    fontSize: '21px',
    lineHeight: '1.3',
    fontWeight: '600',
    color: '#484848',
    padding: '17px 0 0',
}

const text = {
    margin: '0 0 10px 0',
    textAlign: 'left' as const,
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#3c4149',
}

const link = {
    color: '#4C8CFF',
    textDecoration: 'underline',
}

const buttonContainer = {
    padding: '27px 0 27px',
    textAlign: 'center' as const,
}

const button = {
    backgroundColor: '#4C8CFF',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
}

const hr = {
    borderColor: '#dfe1e4',
    margin: '42px 0 26px',
}

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '1.4',
    margin: '0 0 10px 0',
}
