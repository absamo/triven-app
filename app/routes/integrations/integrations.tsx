import Integrations from '~/app/pages/Integrations/Integrations'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/integrations'

export async function loader({ request }: Route.LoaderArgs) {
    const user = await requireBetterAuthUser(request, ["read:settings"])

    return {
        user,
        agencies: [],
        sites: [],
        roles: []
    }
}

export default function IntegrationsRoute() {
    return <Integrations />
}
