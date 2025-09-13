import { Button, Group, Table, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router";
import type { ICategory } from "~/app/common/validations/categorySchema";
import { CategoryImportModal } from "~/app/components";
import { Title } from "~/app/partials/Title";

interface CategoriesProps {
  categories: ICategory[]
  permissions: string[]
}

export default function Categories({
  categories = [],
  permissions = [],
}: CategoriesProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const navigate = useNavigate()
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false)
  const [categoriesList, setCategoriesList] = useState<ICategory[]>(categories)

  const canEdit = permissions.includes("update:categories")
  const canCreate = permissions.includes("create:categories")

  // Handle category import
  const handleImportCategories = (importedCategories: any[]) => {
    // Add the imported categories to the current category list immediately
    if (importedCategories && importedCategories.length > 0) {
      setCategoriesList((prevCategories) => [...importedCategories, ...prevCategories])
    }
  }

  const rows = categoriesList.map(({ id, name }) => (
    <Table.Tr
      key={id}
      onClick={() => canEdit && navigate(`/categories/${id}/edit`)}
    >
      <Table.Td>
        <Text size="sm">{name}</Text>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <>
      <Title
        to={"/categories/create"}
        canCreate={canCreate}
        additionalButtons={
          <Group>
            <Button
              variant="outline"
              leftSection={<IconUpload size={16} />}
              onClick={openImportModal}
              disabled={!canCreate}
            >
              {t('common:import')}
            </Button>
          </Group>
        }
      >
        {t('categoryTitle')}
      </Title>

      <Table
        verticalSpacing="xs"
        highlightOnHover={canEdit}
        withTableBorder
        striped
        mt={35}
      >
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('categoryName')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <CategoryImportModal
        opened={importModalOpened}
        onClose={closeImportModal}
        onImport={handleImportCategories}
      />
    </>
  )
}
