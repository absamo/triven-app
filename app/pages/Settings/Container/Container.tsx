import {
  Anchor,
  Box,
  Center,
  Container,
  Grid,
  NavLink,
  Paper,
  rem,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link, Outlet } from 'react-router'
import classes from './Container.module.css'
// import // IconGauge,
// IconFingerprint,
// IconActivity,
// IconChevronRight,
// "@tabler/icons-react"
// import { useState } from "react"

// import Currency from "~/app/components/Currency"

// const data = [{ label: "Currency", description: "Set default currencies" }]

export default function ContainerPage({ children }) {
  // const [active, setActive] = useState(0)

  // const items = data.map((item, index) => (
  //   // eslint-disable-next-line jsx-a11y/anchor-has-content
  //   <NavLink
  //     component={Link}
  //     to={"/company/currencies"}
  //     key={item.label}
  //     active={index === active}
  //     label={item.label}
  //     description={item.description}
  //     // rightSection={item.rightSection}
  //     onClick={() => setActive(index)}
  //     variant="subtle"
  //   />
  // ))

  return (
    <Grid
      style={{
        minHeight: 'calc(100vh - 92px)',
        display: 'flex',
      }}
    >
      {/* <Grid.Col span={3}>
        <Paper
          style={{
            height: "100%",
          }}
          withBorder
          p="md"
        >
          <Box>{items}</Box>
        </Paper>
      </Grid.Col> */}
      <Grid.Col span={'auto'}>
        <Paper
          style={{
            height: '100%',
          }}
          withBorder
          p="xl"
        >
          <Anchor c="blue" size="md" component={Link} to={'/settings'}>
            <Center inline>
              <IconArrowLeft style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
              <Box ml={5}>Back to settings</Box>
            </Center>
          </Anchor>
          <Container mt="md" size="responsive" ml={0} pl={0}>
            {children}
          </Container>
        </Paper>
      </Grid.Col>
    </Grid>
  )
}
