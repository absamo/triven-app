import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction, type LoaderFunctionArgs } from "react-router"

// import {
//   Body,
//   Button,
//   Container,
//   Column,
//   Head,
//   Heading,
//   Hr,
//   Html,
//   Img,
//   Link,
//   Preview,
//   Row,
//   Section,
//   Tailwind,
//   Text,
// } from "@react-email/components"
// import { render } from "@react-email/render"
// import sendgrid from "@sendgrid/mail"

import type { ITeam } from "~/app/common/validations/teamSchema"
import Teams from "~/app/pages/Teams"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { activateTeamMember, deactivateTeamMember, getTeamMembers, resendInvitation } from "~/app/services/teams.server"
import type { Route } from "./+types/teams"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["read:users"])

  const teams = await getTeamMembers(request)

  return {
    teams,
    currentUser: user,
    permissions: user?.role?.permissions?.filter(
      (permission) =>
        permission === "create:users" ||
        permission === "update:users" ||
        permission === "delete:users"
    ) || [],
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const user = await requireBetterAuthUser(request, ["delete:users"])
  const formData = await request.formData()
  const actionType = formData.get("actionType") as string
  const userId = formData.get("userId") as string

  if (!actionType || !userId) {
    return {
      notification: {
        message: "Missing required parameters",
        status: "Error",
      },
    }
  }

  // Prevent users from deactivating themselves
  if ((actionType === "deactivate" || actionType === "activate") && userId === user.id) {
    return {
      notification: {
        message: "You cannot deactivate or reactivate your own account",
        status: "Error",
      },
    }
  }

  switch (actionType) {
    case "deactivate":
      return await deactivateTeamMember(request, userId)
    case "activate":
      return await activateTeamMember(request, userId)
    case "resendInvitation":
      return await resendInvitation(request, userId)
    default:
      return {
        notification: {
          message: "Invalid action",
          status: "Error",
        },
      }
  }
}

// export const action: ActionFunction = async ({ request }: ActionArgs) => {
//   const { email, profile, role } = memberSchema.parse(
//     dot.object(Object.fromEntries(await request.formData()))
//   ) as IMember

//   sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "")

//   const inviteLink = `${process.env.BASE_URL}/confirmation/${member.sentInvitations[0].token}`

//   const emailHtml = render(
//     <VercelInviteUserEmail
//       baseUrl={process.env.BASE_URL}
//       inviteLink={inviteLink}
//       username={member.profile?.firstName}
//       invitedByUsername={currentUser.profile?.firstName}
//       invitedByEmail={currentUser.email}
//     />
//   )

//   const options = {
//     from: {
//       name: "Sender",
//       email: "mascoolj@gmail.com",
//     },
//     to: "mascoolj@gmail.com",
//     subject: "React email",
//     html: emailHtml,
//   }

//   await sendgrid.send(options)

//   return redirect("/members")
// }

// interface VercelInviteUserEmailProps {
//   username?: string
//   userImage?: string
//   invitedByUsername?: string
//   invitedByEmail?: string
//   teamName?: string
//   teamImage?: string
//   inviteLink?: string
//   inviteFromIp?: string
//   inviteFromLocation?: string
//   baseUrl?: string
// }

// export const VercelInviteUserEmail = ({
//   baseUrl,
//   username = "",
//   userImage = `${baseUrl}/static/vercel-user.png`,
//   invitedByUsername = "",
//   invitedByEmail = "",
//   teamName = "",
//   teamImage = `${baseUrl}/static/vercel-team.png`,
//   inviteLink = "https://vercel.com/teams/invite/foo",
//   inviteFromIp = "204.13.186.218",
//   inviteFromLocation = "Lyon, France",
// }: VercelInviteUserEmailProps) => {
//   const previewText = `Join ${invitedByUsername} on M-Stack`

//   return (
//     <Html>
//       <Head />
//       <Preview>{previewText}</Preview>
//       <Tailwind>
//         <Body className="bg-white my-auto mx-auto font-sans">
//           <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
//             <Section className="mt-[32px]">
//               <Img
//                 src={`${baseUrl}/static/vercel-logo.png`}
//                 width="40"
//                 height="37"
//                 alt="Vercel"
//                 className="my-0 mx-auto"
//               />
//             </Section>
//             <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
//               Join your team on <strong>M-Stack</strong>
//             </Heading>
//             <Text className="text-black text-[14px] leading-[24px]">
//               Hello {username},
//             </Text>
//             <Text className="text-black text-[14px] leading-[24px]">
//               <strong>{invitedByUsername}</strong> (
//               <Link
//                 href={`mailto:${invitedByEmail}`}
//                 className="text-blue-600 no-underline"
//               >
//                 {invitedByEmail}
//               </Link>
//               ) has invited you to the <strong>{teamName}</strong> team on{" "}
//               <strong>M-Stack</strong>.
//             </Text>
//             <Section>
//               <Row>
//                 <Column align="right">
//                   <Img
//                     className="rounded-full"
//                     src={userImage}
//                     width="64"
//                     height="64"
//                   />
//                 </Column>
//                 <Column align="center">
//                   <Img
//                     src={`${baseUrl}/static/vercel-arrow.png`}
//                     width="12"
//                     height="9"
//                     alt="invited you to"
//                   />
//                 </Column>
//                 <Column align="left">
//                   <Img
//                     className="rounded-full"
//                     src={teamImage}
//                     width="64"
//                     height="64"
//                   />
//                 </Column>
//               </Row>
//             </Section>
//             <Section className="text-center mt-[32px] mb-[32px]">
//               <Button
//                 pX={20}
//                 pY={12}
//                 className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center"
//                 href={inviteLink}
//               >
//                 Join the team
//               </Button>
//             </Section>
//             <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
//             <Text className="text-[#666666] text-[12px] leading-[24px]">
//               This invitation was intended for{" "}
//               <span className="text-black">{username} </span>.This invite was
//               sent from <span className="text-black">{inviteFromIp}</span>{" "}
//               located in{" "}
//               <span className="text-black">{inviteFromLocation}</span>. If you
//               were not expecting this invitation, you can ignore this email. If
//               you are concerned about your account's safety, please reply to
//               this email to get in touch with us.
//             </Text>
//           </Container>
//         </Body>
//       </Tailwind>
//     </Html>
//   )
// }

export default function TeamsRoute({ loaderData }: Route.ComponentProps) {
  const { teams, currentUser, permissions } = loaderData as unknown as {
    teams: ITeam[]
    currentUser: any
    permissions: string[]
  }

  return <Teams teams={teams} currentUser={currentUser} permissions={permissions} />
}
