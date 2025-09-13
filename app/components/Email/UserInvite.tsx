import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text
} from "@react-email/components"

interface InviteUserEmailProps {
  username: string
  userImage?: string
  invitedByUsername: string
  invitedByEmail: string
  teamName?: string
  teamImage?: string
  inviteLink: string
  inviteFromIp?: string
  inviteFromLocation?: string
}

export const InviteUserEmail = ({
  username,
  userImage,
  invitedByUsername,
  invitedByEmail,
  teamName,
  teamImage,
  inviteLink,
  inviteFromIp = "204.13.186.218",
  inviteFromLocation = "Lyon, France",
}: InviteUserEmailProps) => {
  const previewText = `Join ${invitedByUsername} on TRIVEN`

  //const baseUrl = process.env.BASE_URL

  return (
    <Html>
      <Head />
      <Font
        fontFamily="Karla"
        fallbackFontFamily="Verdana"
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="flex flex-row justify-center mt-[32px]">
              <Img
                src={`http://localhost:3000/assets/triven-logo.png`}
                height="50px"
                width="170px"
                alt="TRIVEN"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Join your organisation team
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username},
            </Text>
            {invitedByUsername && (
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>{invitedByUsername}</strong> (
                <Link
                  href={`mailto:${invitedByEmail}`}
                  className="text-blue-600 no-underline"
                >
                  {invitedByEmail}
                </Link>
                ) has invited you to the <strong>{teamName}</strong> team on{" "}
                <strong>TRIVEN</strong>.
              </Text>
            )}
            {/* <Section>
              <Row>
                <Column align="right">
                  <Img
                    className="rounded-full"
                    src={userImage}
                    width="64"
                    height="64"
                  />
                </Column>
                <Column align="center">
                  <Img
                    // src={`${baseUrl}/static/vercel-arrow.png`}
                    width="12"
                    height="9"
                    alt="invited you to"
                  />
                </Column>
                <Column align="left">
                  <Img
                    className="rounded-full"
                    src={teamImage}
                    width="64"
                    height="64"
                  />
                </Column>
              </Row>
            </Section> */}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                style={{ color: "#61dafb", padding: "10px 20px" }}
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center"
                href={inviteLink}
              >
                Join the team
              </Button>
            </Section>
            {/* <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" /> */}
            {/* <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation was intended for{" "}
              <span className="text-black">{username} </span>.This invite was
              sent from <span className="text-black">{inviteFromIp}</span>{" "}
              located in{" "}
              <span className="text-black">{inviteFromLocation}</span>. If you
              were not expecting this invitation, you can ignore this email. If
              you are concerned about your account's safety, please reply to
              this email to get in touch with us.
            </Text> */}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
