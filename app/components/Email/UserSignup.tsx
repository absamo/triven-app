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
  Text,
} from '@react-email/components'

interface UserSignupProps {
  userFirstname: string
  inviteLink: string
}

const baseUrl = process.env.BASE_URL

export const UserSignup = ({ userFirstname, inviteLink }: UserSignupProps) => (
  <Html>
    <Head />
    <Preview>The inventory management solution that helps you streamline your operations.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/assets/triven-logo.png`}
          width="170"
          height="50"
          alt="TRIVEN"
          style={logo}
        />
        <Text style={paragraph}>Hi {userFirstname},</Text>
        <Text style={paragraph}>Welcome to TRIVEN! We're excited to have you on board.</Text>
        <Text style={paragraph}>
          To get started, please click the button below to complete your registration.
        </Text>
        <Section>
          <Button style={button} href={inviteLink}>
            Complete your registration
          </Button>
        </Section>
        <Text>
          Thank you,
          <br />
          The TRIVEN Team
        </Text>
        <Hr style={hr} />
        {/* <Text style={footer}>408 Warren Rd - San Mateo, CA 94402</Text> */}
      </Container>
    </Body>
  </Html>
)

export default UserSignup

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}

const logo = {
  margin: '0 auto',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
}

const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '10px 20px',
}

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
  fontWeight: 'bold',
}

// const footer = {
//   color: "#8898aa",
//   fontSize: "12px",
// }
