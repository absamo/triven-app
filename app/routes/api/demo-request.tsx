import { render } from '@react-email/components'
import type { ActionFunctionArgs } from 'react-router'

import { demoRequestSchema } from '~/app/common/validations/demoRequestSchema'
import DemoRequestEmail from '~/app/emails/demo-request'
import { sendEmail } from '~/app/modules/email/email.server'
import { getClientIP, getDetailedLocationInfo } from '~/app/utils/geolocation.server'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()

    // Get client IP address using helper function

    const clientIP = await getClientIP(request)

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get detailed location and network information using helper function

    const geoResult = await getDetailedLocationInfo(clientIP)

    // Validate the request data

    const validationResult = demoRequestSchema.safeParse({
      ...body,
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      submittedAt: new Date(),
    })

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid form data',
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const demoRequest = validationResult.data

    // Render the email template

    const emailHtml = await render(
      DemoRequestEmail({
        name: demoRequest.name,
        workEmail: demoRequest.workEmail,
        companyName: demoRequest.companyName,
        phoneNumber: demoRequest.phoneNumber,
        companySize: demoRequest.companySize,
        preferredDate: demoRequest.preferredDate?.toISOString(),
        preferredTime: demoRequest.preferredTime,
        timezone: demoRequest.timezone,
        message: demoRequest.message,
        submittedAt: demoRequest.submittedAt?.toISOString(),
        clientIP: clientIP,
        userAgent: userAgent,
        locationInfo: geoResult.locationInfo,
        networkInfo: geoResult.networkInfo.formatted,
        detailedLocation: geoResult.detailedLocation,
      })
    )

    // Send email to the sales team (you can configure multiple recipients)
    const salesEmails = process.env.SALES_TEAM_EMAILS
      ? process.env.SALES_TEAM_EMAILS.split(',').map((email) => email.trim())
      : ['sales@triven.com'] // Default fallback

    await sendEmail({
      to: salesEmails,
      subject: `New Demo Request from ${demoRequest.name} at ${demoRequest.companyName}`,
      html: emailHtml,
    })

    // Optionally, send a confirmation email to the requester
    if (process.env.SEND_DEMO_CONFIRMATION === 'true') {
      const confirmationHtml = await render(
        DemoRequestEmail({
          name: demoRequest.name,
          workEmail: demoRequest.workEmail,
          companyName: demoRequest.companyName,
          phoneNumber: demoRequest.phoneNumber,
          companySize: demoRequest.companySize,
          message: 'Thank you for requesting a demo! Our team will contact you soon.',
          submittedAt: demoRequest.submittedAt?.toISOString(),
        })
      )

      await sendEmail({
        to: demoRequest.workEmail,
        subject: 'Thank you for your demo request - Triven',
        html: confirmationHtml,
      })
    }

    // Here you could also save to database if needed
    // await saveDemoRequestToDatabase(demoRequest)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo request submitted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('💥 Error processing demo request:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('💥 Error message:', error instanceof Error ? error.message : String(error))

    return new Response(
      JSON.stringify({
        error: 'Failed to process demo request',
        message: 'Please try again later or contact support.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
