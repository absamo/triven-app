import {
    Alert,
    Button,
    Flex,
    Paper,
    PinInput,
    Stack,
    Text,
    Title,
    rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconExclamationCircle, IconMail } from "@tabler/icons-react";
import { useState } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { AuthIconBadge, BackButton, Logo } from "~/app/components";
import { authClient } from "~/app/lib/auth.client";

interface LoaderData {
    email: string;
}

interface ActionData {
    error?: string;
    email?: string;
}

export default function VerifyEmail() {
    const { email } = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const navigation = useNavigation();
    const [otp, setOtp] = useState("");
    const [isResending, setIsResending] = useState(false);

    const isSubmitting = navigation.state === "submitting";
    const error = actionData?.error;

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification"
            });

            if (result.error) {
                notifications.show({
                    title: "Failed to Resend Code",
                    message: result.error.message || "Failed to resend verification code. Please try again.",
                    color: "red",
                });
            } else {
                notifications.show({
                    title: "Code Sent",
                    message: "A new verification code has been sent to your email.",

                });
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Something went wrong. Please try again.",
                color: "red",
            });
        } finally {
            setIsResending(false);
        }
    };

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
            {/* Back to Sign Up - Top Left */}
            <BackButton to="/signup" position="top-left">
                Back to Sign Up
            </BackButton>

            <div style={{ width: '100%', maxWidth: 600 }}>
                {/* Logo */}
                <Flex justify="center" mb={24}>
                    <Logo alt="TRIVEN" />
                </Flex>

                <Paper
                    withBorder
                    shadow="xl"
                    p={40}
                    radius="lg"
                    style={{
                        width: '100%',
                        background: 'white'
                    }}
                >

                    {/* Header */}
                    <Stack align="center" gap="sm" mb={32}>
                        <AuthIconBadge icon={IconMail} theme="blue" />

                        <Title order={2} size="h2" fw={600} c="#374151" ta="center">
                            Verify Your Email
                        </Title>

                        <Text size="sm" c="dimmed" ta="center" maw={400}>
                            We've sent a 6-digit verification code to <strong> {email}</strong>.

                        </Text>
                    </Stack>

                    {/* Error Alert */}
                    {error && (
                        <Alert
                            icon={<IconExclamationCircle size={16} />}
                            color="red"
                            mb="md"
                            styles={{
                                message: { fontSize: rem(14) }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <Form method="post">
                        <input type="hidden" name="email" value={email} />
                        <input type="hidden" name="otp" value={otp} />
                        <Stack gap="lg">
                            {/* OTP Input */}
                            <Stack align="center" gap="md">
                                <PinInput
                                    value={otp}
                                    onChange={setOtp}
                                    length={6}
                                    size="lg"
                                    type="number"
                                    placeholder="○"
                                    styles={{
                                        input: {
                                            width: rem(48),
                                            height: rem(48),
                                            fontSize: rem(18),
                                            fontWeight: 600,
                                            border: '2px solid #E5E7EB',
                                            '&:focus': {
                                                borderColor: '#4C8CFF',
                                            }
                                        }
                                    }}
                                />
                            </Stack>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                size="lg"
                                radius="md"
                                fullWidth
                                loading={isSubmitting}
                                disabled={otp.length !== 6}
                                styles={{
                                    root: {
                                        height: rem(48),
                                        backgroundColor: 'var(--mantine-color-green-8)',
                                        '&:hover': {
                                            backgroundColor: 'var(--mantine-color-green-9)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#E5E7EB',
                                            color: '#9CA3AF'
                                        }
                                    }
                                }}
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify Email'}
                            </Button>

                            {/* Resend Code */}
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed" ta="center">
                                    Didn't receive the code?
                                </Text>
                                <Button
                                    variant="subtle"
                                    size="sm"
                                    loading={isResending}
                                    onClick={handleResendCode}
                                    disabled={isSubmitting}
                                    style={{ color: '#4C8CFF' }}
                                >
                                    {isResending ? 'Sending...' : 'Resend Code'}
                                </Button>
                            </Stack>
                        </Stack>
                    </Form>
                </Paper>
            </div>
        </div>
    );
}
