import { data } from 'react-router'
import { prisma } from '~/app/db.server'

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  const { email } = await request.json()

  if (!email) {
    return data({ error: 'Email is required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { active: true, id: true },
    })

    if (!user) {
      // User doesn't exist - let the normal auth flow handle this
      return data({ active: true })
    }

    if (user.active === false) {
      return data({ active: false, inactive: true })
    }

    return data({ active: true })
  } catch (error) {
    console.error('Error checking user status:', error)
    return data({ error: 'Internal server error' }, { status: 500 })
  }
}
