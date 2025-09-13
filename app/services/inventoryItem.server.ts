import { nanoid } from "nanoid"

import {
  getInventoryCollection,
  queryInventoryByFilter,
} from "~/app/utils/chroma"
import { generateEmbedding } from "~/app/utils/embedding"
import { prisma } from "../db.server"

export async function CreateInventoryItem(item: {
  name: string
  description: string
  quantity: number
  reorderLevel: number
}) {
  const embedding = await generateEmbedding(
    item.description ||
    item.name ||
    item.quantity.toString() ||
    item.reorderLevel.toString()
  )

  const inventoryCollection = await getInventoryCollection("inventory-items")

  inventoryCollection.add({
    ids: [nanoid()],
    embeddings: [embedding],
    metadatas: [
      {
        name: item.name,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
      },
    ],
    documents: [
      item.description,
      item.name,
      item.quantity.toString(),
      item.reorderLevel.toString(),
    ],
  })
}

export async function searchSimilarItems(query: string) {
  const result = await queryInventoryByFilter({
    collectionName: "inventory-items",
    query: query,
    //filter: { quantity: { $gt: 0 } }, // Example filter
  } as any) // Type assertion to bypass type checking for the filter

  const ids = result.ids[0] // 2D array

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: ids } },
  })

  // Optional: sort to match embedding similarity order
  const orderMap = new Map(ids.map((id, i) => [id, i]))
  return items.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!)
}
