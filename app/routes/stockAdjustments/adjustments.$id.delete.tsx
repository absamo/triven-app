import type { ActionArgs } from "react-router";

import { deleteAdjustment } from "~/app/services/stockAdjustment.server"

export async function action({ request, params }: ActionArgs) {
  return await deleteAdjustment(request, params.id)
}
