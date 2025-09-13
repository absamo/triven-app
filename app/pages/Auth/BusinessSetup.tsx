import {
    Alert,
    Button,
    Center,
    Container,
    Grid,
    Group,
    Image,
    Paper,
    Select,
    Stack,
    Stepper,
    Text,
    TextInput,
    Title,
    useMantineColorScheme
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { IconAlertCircle, IconBuildingStore, IconBuildingWarehouse, IconCheck, IconUsers } from "@tabler/icons-react"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { useSubmit } from "react-router"
import { z } from "zod"
import { ClientGeolocation } from "~/app/services/geolocation.client"
import { getAllCountries, getAllCurrencies, getCountryCurrency, mapCountryNameToCode } from "~/app/utils/countries"

const businessSetupSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyCountry: z.string().min(1, "Country is required"),
    companyCity: z.string().min(1, "City is required"),
    companyAddress: z.string().optional(),
    companyPostalCode: z.string().optional(),
    defaultCurrency: z.string().min(1, "Default currency is required"),
    agencyName: z.string().min(1, "Agency name is required"),
    agencyCountry: z.string().min(1, "Agency country is required"),
    agencyCity: z.string().min(1, "Agency city is required"),
    agencyAddress: z.string().optional(),
    agencyPostalCode: z.string().optional(),
    warehouseName: z.string().min(1, "Warehouse name is required"),
    warehouseCountry: z.string().min(1, "Warehouse country is required"),
    warehouseCity: z.string().min(1, "Warehouse city is required"),
    warehouseAddress: z.string().optional(),
    warehousePostalCode: z.string().optional(),
})

interface BusinessSetupProps {
    user: any
    error?: string
}

// Get all countries from the centralized helper
const countries = getAllCountries()

// Get all currencies from the centralized helper  
const currencies = getAllCurrencies()

// Helper function to get default currency based on country
const getDefaultCurrencyForCountry = (countryCode: string): string => {
    // Use the countries utility to get currency
    const currency = getCountryCurrency(countryCode)
    return currency || "USD" // Default to USD if not found
}

export default function BusinessSetup({ user, error }: BusinessSetupProps) {
    const { t } = useTranslation(['auth', 'common'])
    const submit = useSubmit()
    const { colorScheme } = useMantineColorScheme()
    const [active, setActive] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationDetected, setLocationDetected] = useState(false)

    const form = useForm({
        validate: zodResolver(businessSetupSchema),
        initialValues: {
            companyName: "",
            companyCountry: "",
            companyCity: "",
            companyAddress: "",
            companyPostalCode: "",
            defaultCurrency: "USD",
            agencyName: "Main Agency",
            agencyCountry: "",
            agencyCity: "",
            agencyAddress: "",
            agencyPostalCode: "",
            warehouseName: "Main Warehouse",
            warehouseCountry: "",
            warehouseCity: "",
            warehouseAddress: "",
            warehousePostalCode: "",
        },
    })

    // Auto-detect user location on component mount
    useEffect(() => {
        const detectLocation = async () => {
            if (locationDetected) return // Only detect once

            setLocationLoading(true)
            try {
                const location = await ClientGeolocation.getUserLocation()

                if (location.country && location.city) {
                    const countryCode = mapCountryNameToCode(location.country)
                    const defaultCurrency = getDefaultCurrencyForCountry(countryCode)

                    // Auto-fill form with detected location
                    form.setValues({
                        companyCountry: countryCode,
                        companyCity: location.city,
                        agencyCountry: countryCode,
                        agencyCity: location.city,
                        warehouseCountry: countryCode,
                        warehouseCity: location.city,
                        defaultCurrency: defaultCurrency,
                    })

                    setLocationDetected(true)
                }
            } catch (error) {
                // Set defaults for France if detection fails
                form.setValues({
                    companyCountry: "FR",
                    companyCity: "Paris",
                    agencyCountry: "FR",
                    agencyCity: "Paris",
                    warehouseCountry: "FR",
                    warehouseCity: "Paris",
                    defaultCurrency: "EUR",
                })
            } finally {
                setLocationLoading(false)
            }
        }

        detectLocation()
    }, []) // Empty dependency array to run only once

    const nextStep = () => setActive((current) => (current < 2 ? current + 1 : current))
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

    const handleSubmit = async (values: typeof form.values) => {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("companyName", values.companyName)
        formData.append("companyCountry", values.companyCountry)
        formData.append("companyCity", values.companyCity)
        formData.append("companyAddress", values.companyAddress || "")
        formData.append("companyPostalCode", values.companyPostalCode || "")
        formData.append("agencyName", values.agencyName)
        formData.append("agencyCountry", values.agencyCountry)
        formData.append("agencyCity", values.agencyCity)
        formData.append("agencyAddress", values.agencyAddress || "")
        formData.append("agencyPostalCode", values.agencyPostalCode || "")
        formData.append("warehouseName", values.warehouseName)
        formData.append("warehouseAddress", values.warehouseAddress || "")
        formData.append("warehouseCity", values.warehouseCity)
        formData.append("warehouseCountry", values.warehouseCountry)
        formData.append("warehousePostalCode", values.warehousePostalCode || "")
        formData.append("defaultCurrency", values.defaultCurrency)
        submit(formData, { method: "post" })
    }

    const validateStep = (step: number) => {
        switch (step) {
            case 0:
                return form.values.companyName &&
                    form.values.companyCountry &&
                    form.values.companyCity &&
                    form.values.defaultCurrency
            case 1:
                return form.values.agencyName &&
                    form.values.agencyCountry &&
                    form.values.agencyCity
            case 2:
                return form.values.warehouseName &&
                    form.values.warehouseCountry &&
                    form.values.warehouseCity
            default:
                return false
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'light-dark(linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, rgb(207, 227, 234) 100%), linear-gradient(135deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-7) 50%, var(--mantine-color-dark-6) 100%))',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <Container size="md">
                {/* Logo */}
                <Center>
                    <Image
                        src={colorScheme === 'dark' ? "/assets/triven_dark.png" : "/assets/triven_light.png"}
                        alt="TRIVEN"
                        w={130}
                        fit="contain"
                    />
                </Center>

                <Paper
                    withBorder
                    shadow="xl"
                    p={40}
                    radius="lg"
                    style={{
                        minWidth: '950px',
                        // minHeight: '816px',
                        width: '100%'
                    }}
                >
                    {/* Welcome Header */}
                    <Center mb="md">
                        <Title order={2} size="h2" fw={600} c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))">
                            Complete Your Business Setup
                        </Title>
                    </Center>

                    <Center mb="xl">
                        <Text size="sm" c="dimmed" ta="center">
                            Welcome {`${user?.profile?.firstName} (${user?.email})`}! Let's set up your business details to get started.
                        </Text>
                    </Center>


                    {error && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            title="Setup Error"
                            color="red"
                            mb="md"
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Enhanced Mantine Stepper with Numbers */}
                    <div style={{ marginBottom: 32 }}>
                        <Stepper
                            active={active}
                            onStepClick={setActive}
                            allowNextStepsSelect={false}
                            size="xl"
                            iconSize={32}
                            styles={{
                                stepIcon: {
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    width: '40px',
                                    height: '40px',
                                    borderWidth: '2px',
                                },
                                stepBody: {
                                    marginTop: '8px'
                                },
                                stepLabel: {
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-2))'
                                },
                                stepDescription: {
                                    fontSize: '12px',
                                    color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
                                    marginTop: '2px'
                                },
                                separator: {
                                    backgroundColor: 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                    height: '2px'
                                }
                            }}
                        >
                            <Stepper.Step
                                label="Company & Currency"
                                description="Basic company information"
                                icon={active > 0 ? <IconCheck size={16} /> : "1"}
                                completedIcon={<IconCheck size={16} />}
                            >
                                <Stack gap="xl" mt="md">
                                    {/* Company Information */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <IconBuildingStore size={20} color="var(--mantine-color-blue-6)" />
                                            <Text size="md" fw={600} c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))">Company Information</Text>
                                        </div>
                                        <Stack gap="md">

                                            <Grid>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Company Name"
                                                        placeholder="Enter your company name"
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        {...form.getInputProps("companyName")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Select
                                                        label="Default Currency"
                                                        placeholder="Select your primary currency"
                                                        data={currencies}
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        searchable
                                                        {...form.getInputProps("defaultCurrency")}
                                                        description="This will be your default currency for all transactions."
                                                        inputWrapperOrder={['label', 'input', 'description', 'error']}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Select
                                                        label="Country"
                                                        placeholder="Select country"
                                                        data={countries}
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        searchable
                                                        checkIconPosition="right"
                                                        {...form.getInputProps("companyCountry")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="City"
                                                        placeholder="Enter city"
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        {...form.getInputProps("companyCity")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Address"
                                                        placeholder="Enter company address"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("companyAddress")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Postal Code"
                                                        placeholder="Enter postal code"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("companyPostalCode")}
                                                    />
                                                </Grid.Col>
                                            </Grid>

                                        </Stack>
                                    </div>


                                </Stack>
                            </Stepper.Step>

                            <Stepper.Step
                                label="Agency Setup"
                                description="Main business agency"
                                icon={active > 1 ? <IconCheck size={16} /> : "2"}
                                completedIcon={<IconCheck size={16} />}
                            >
                                <Stack gap="xl" mt="md">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <IconUsers size={20} color="var(--mantine-color-blue-6)" />
                                            <div>
                                                <Text size="md" fw={600} c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))">Agency Setup</Text>
                                                <Text size="xs" c="dimmed">
                                                    This will be your main business agency. You can create additional agencies later.
                                                </Text>
                                            </div>
                                        </div>
                                        <Stack gap="md">
                                            <TextInput
                                                label="Agency Name"
                                                placeholder="Enter your main agency name"
                                                size="sm"
                                                radius="md"
                                                withAsterisk
                                                {...form.getInputProps("agencyName")}

                                            />
                                            <Grid>
                                                <Grid.Col span={6}>
                                                    <Select
                                                        label="Agency Country"
                                                        placeholder="Select country"
                                                        data={countries}
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        searchable
                                                        {...form.getInputProps("agencyCountry")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Agency City"
                                                        placeholder="Enter city"
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        {...form.getInputProps("agencyCity")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Agency Address"
                                                        placeholder="Enter agency address"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("agencyAddress")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Agency Postal Code"
                                                        placeholder="Enter postal code"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("agencyPostalCode")}
                                                    />
                                                </Grid.Col>
                                            </Grid>
                                        </Stack>
                                    </div>
                                </Stack>
                            </Stepper.Step>

                            <Stepper.Step
                                label="Warehouse Setup"
                                description="Main warehouse location"
                                icon={active > 2 ? <IconCheck size={16} /> : "3"}
                                completedIcon={<IconCheck size={16} />}
                            >
                                <Stack gap="xl" mt="md">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <IconBuildingWarehouse size={20} color="var(--mantine-color-blue-6)" />
                                            <div>
                                                <Text size="md" fw={600} c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))">Warehouse Setup</Text>
                                                <Text size="xs" c="dimmed" >
                                                    Your main warehouse location for inventory management. Additional locations can be added later.
                                                </Text>
                                            </div>
                                        </div>
                                        <Stack gap="md">
                                            <TextInput
                                                label="Name"
                                                placeholder="Enter your main warehouse name"
                                                size="sm"
                                                radius="md"
                                                withAsterisk
                                                {...form.getInputProps("warehouseName")}
                                            />
                                            <Grid>
                                                <Grid.Col span={6}>
                                                    <Select
                                                        label="Warehouse Country"
                                                        placeholder="Select country"
                                                        data={countries}
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        searchable
                                                        checkIconPosition="right"
                                                        {...form.getInputProps("warehouseCountry")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="City"
                                                        placeholder="Enter city"
                                                        size="sm"
                                                        radius="md"
                                                        withAsterisk
                                                        {...form.getInputProps("warehouseCity")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <TextInput
                                                        label="Address"
                                                        placeholder="Enter warehouse address"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("warehouseAddress")}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>



                                                    <TextInput
                                                        label="Postal Code"
                                                        placeholder="Enter postal code"
                                                        size="sm"
                                                        radius="md"
                                                        {...form.getInputProps("warehousePostalCode")}
                                                    />
                                                </Grid.Col>
                                            </Grid>
                                        </Stack>

                                    </div>


                                </Stack>
                            </Stepper.Step>
                        </Stepper>
                    </div>

                    {/* Navigation Buttons */}
                    <Group justify="space-between" mt="xl">
                        <Button
                            variant="default"
                            onClick={prevStep}
                            disabled={active === 0}
                            size="md"
                            radius="md"
                        >
                            Back
                        </Button>

                        {active < 2 ? (
                            <Button
                                onClick={nextStep}
                                disabled={!validateStep(active)}
                                size="md"
                                radius="md"
                                styles={{
                                    root: {
                                        backgroundColor: 'var(--mantine-color-green-8)',
                                        '&:hover': {
                                            backgroundColor: 'var(--mantine-color-green-9)'
                                        }
                                    }
                                }}
                            >
                                Next Step
                            </Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    if (form.isValid()) {
                                        handleSubmit(form.values)
                                    } else {
                                        form.validate()
                                    }
                                }}
                                loading={isLoading}
                                disabled={!validateStep(active)}
                                size="md"
                                radius="md"
                                styles={{
                                    root: {
                                        backgroundColor: 'var(--mantine-color-green-8)',
                                        '&:hover': {
                                            backgroundColor: 'var(--mantine-color-green-9)'
                                        }
                                    }
                                }}
                            >
                                Complete Setup
                            </Button>
                        )}
                    </Group>
                </Paper>
            </Container>
        </div>
    )
}
