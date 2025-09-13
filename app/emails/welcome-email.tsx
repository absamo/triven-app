import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text
} from '@react-email/components';

interface WelcomeEmailProps {
    name?: string;
    dashboardUrl?: string;
}

export default function WelcomeEmail({
    name = 'User',
    dashboardUrl = 'https://app.triven.com/dashboard',
}: WelcomeEmailProps) {
    return (
        <Html lang="en">
            <Head />
            <Preview>Welcome to Triven! Your account is ready 🎉</Preview>
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
                        <Text style={title}>Welcome to Triven!</Text>
                        <Text style={text}>
                            Hi {name},
                        </Text>
                        <Text style={text}>
                            Congratulations! Your business setup is complete and your Triven account is now fully active.
                        </Text>
                        <Text style={text}>
                            You can now access all features of our platform including inventory management, order tracking, and analytics for your business.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={dashboardUrl}>
                                Access Dashboard
                            </Button>
                        </Section>

                        <Text style={text}>
                            Here are some things you can do to get started:
                        </Text>
                        <Text style={listItem}>• Complete your business setup</Text>
                        <Text style={listItem}>• Add your first products</Text>
                        <Text style={listItem}>• Set up your suppliers</Text>
                        <Text style={listItem}>• Explore our analytics dashboard</Text>

                        <Hr style={hr} />

                        <Text style={footer}>
                            If you have any questions or need help getting started, please don't hesitate to contact our support team. We're here to help you succeed!
                        </Text>

                        <Text style={footer}>
                            Best regards,<br />
                            The Triven Team
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

const listItem = {
    margin: '0 0 8px 0',
    textAlign: 'left' as const,
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#3c4149',
    paddingLeft: '16px',
};

const buttonContainer = {
    padding: '27px 0 27px',
    textAlign: 'center' as const,
};

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
