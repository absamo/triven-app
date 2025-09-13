import { ActionIcon, Group, Paper, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import classes from "./CookieNotice.module.css";

const COOKIE_NOTICE_KEY = "cookie-notice-dismissed";

export default function CookieNotice() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the user has already dismissed the notice
        const isDismissed = localStorage.getItem(COOKIE_NOTICE_KEY);
        if (!isDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(COOKIE_NOTICE_KEY, "true");
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <Paper className={classes.cookieNotice} shadow="lg" p="md" withBorder>
            <Group justify="space-between" align="flex-start" gap="md">
                <Text size="sm" className={classes.text}>
                    Triven uses cookies to maintain user sessions and track marketing efforts. By continuing to use our
                    website, you agree to our use of cookies for these purposes. Read our Privacy Policy.
                </Text>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleDismiss}
                    className={classes.closeButton}
                    aria-label="Close cookie notice"
                >
                    <IconX size={18} />
                </ActionIcon>
            </Group>
        </Paper>
    );
}
