import { AppShell } from "@mantine/core";
import type { ReactNode } from "react";
import { useLocation } from "react-router";

import CookieNotice from "../../components/CookieNotice";
import Header from "./Header";
import classes from "./PublicLayout.module.css";

interface LayoutProps {
  children: ReactNode
}

export default function PublicLayoutPage({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <AppShell
      disabled={
        location.pathname === "/login" ||
        location.pathname === "/inactive-user" ||
        location.pathname.split("/")[1] === "confirmation" ||
        location.pathname === "/signup"
      }
      transitionDuration={500}
      transitionTimingFunction="ease"
      padding={0}
      header={{ height: 80 }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main className={classes.main}>{children}</AppShell.Main>
      <CookieNotice />
    </AppShell>
  )
}
