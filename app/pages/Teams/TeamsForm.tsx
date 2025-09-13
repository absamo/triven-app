import { Grid, Select, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { zodResolver } from "mantine-form-zod-resolver"
import { useTranslation } from "react-i18next"
import { useSubmit } from "react-router"

import { type IAgency } from "~/app/common/validations/agencySchema"
import { type IRole } from "~/app/common/validations/roleSchema"
import type { ISite } from "~/app/common/validations/siteSchema"
import { teamSchema, type ITeam } from "~/app/common/validations/teamSchema"
import Form from "~/app/components/Form"
import { AgencySites } from "~/app/partials/AgencySites"
import { Title } from "~/app/partials/Title"

interface TeamsFormProps {
  team: ITeam
  errors: Record<string, string>
  sites: ISite[]
  agencies: IAgency[]
  roles: IRole[]
}

export default function TeamsForm({
  team,
  sites = [],
  agencies,
  roles = [],
  errors,
}: TeamsFormProps) {
  const { t } = useTranslation(['teams', 'forms', 'common']);

  const form = useForm({
    validate: zodResolver(teamSchema),
    initialValues: {
      ...team,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({
    profile,
    email,
    roleId,
    agencyId,
    siteId,
  }: ITeam) => {
    const formData = new FormData()

    formData.append("profile", JSON.stringify(profile))
    formData.append("email", email)
    formData.append("roleId", roleId)
    formData.append("siteId", siteId)
    formData.append("agencyId", agencyId)

    submit(formData, { method: "post" })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={"/teams"}>
          {team.id ? t('teams:editTeamMember', 'Edit a team member') : t('teams:addTeamMember', 'Add a team member')}
        </Title>

        <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('forms:firstName', 'First name')}
              name="profile.firstName"
              {...form.getInputProps("profile.firstName")}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('forms:lastName', 'Last name')}
              name="profile.lastName"
              {...form.getInputProps("profile.lastName")}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('teams:emailAddress', 'Email address')}
              name="email"
              disabled={team.id ? true : false}
              {...form.getInputProps("email")}
              error={form.getInputProps("email").error || errors?.email}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label={t('teams:phoneNumber', 'Phone number')}
              name="profile.phone"
              {...form.getInputProps("profile.phone")}
              value={form.values.profile?.phone || ""}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              withAsterisk
              label={t('teams:role', 'Role')}
              placeholder={t('teams:selectRole', 'Select a role')}
              name="roleId"
              data={roles.map((role) => {
                return {
                  value: role.id || "",
                  label: role.name,
                }
              })}
              {...form.getInputProps("roleId")}
              error={form.getInputProps("roleId").error || errors?.roleId}
            />
          </Grid.Col>
          <AgencySites
            extraProps={{ colSpan: 3 }}
            agencyId={form.values.agencyId}
            agencies={agencies}
            sites={sites}
            siteId={form.values.siteId}
            onChange={({ agencyId, siteId }) => {
              form.setFieldValue("agencyId", agencyId)
              form.setFieldValue("siteId", siteId)
            }}
            error={{
              siteId: form.getInputProps("siteId").error || errors?.siteId,
              agencyId:
                form.getInputProps("agencyId").error || errors?.agencyId,
            }}
          />
        </Form>
      </Grid.Col>
    </Grid>
  )
}
