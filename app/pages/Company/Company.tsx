import { Grid, Box, NavLink, Paper, VisuallyHidden } from "@mantine/core"
import { Link, Outlet } from "react-router";
import {
  IconGauge,
  IconFingerprint,
  IconActivity,
  IconChevronRight,
} from "@tabler/icons-react"
import { useState } from "react"

// import Currency from "~/app/components/Currency"

const data = [{ label: "Currency", description: "Set default currencies" }]

export default function Company() {
  const [active, setActive] = useState(0)

  const items = data.map((item, index) => (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    (<NavLink
      component={Link}
      to={"/company/currencies"}
      key={item.label}
      active={index === active}
      label={item.label}
      description={item.description}
      // rightSection={item.rightSection}
      onClick={() => setActive(index)}
      variant="subtle"
    />)
  ))

  return (
    <Grid
      style={{
        minHeight: "calc(100vh - 92px)",
        display: "flex",
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
      <Grid.Col span={"auto"}>
        <Paper
          // style={{
          //   height: "100%",
          // }}
          withBorder
          p="xl"
        >
          Company page
        </Paper>
      </Grid.Col>
    </Grid>
  )
}

// import { Grid, Box, NavLink, Paper, VisuallyHidden } from "@mantine/core"
// import { Link, Outlet } from "@remix-run/react"
// import {
//   IconGauge,
//   IconFingerprint,
//   IconActivity,
//   IconChevronRight,
// } from "@tabler/icons-react"
// import { useState } from "react"

// import Currency from "~/app/components/Currency"

// const data = [{ label: "Currency", description: "Set default currencies" }]

// export default function Company() {
//   const [active, setActive] = useState(0)

//   const items = data.map((item, index) => (
//     // eslint-disable-next-line jsx-a11y/anchor-has-content
//     <NavLink
//       component={Link}
//       to={"/company/currencies"}
//       key={item.label}
//       active={index === active}
//       label={item.label}
//       description={item.description}
//       // rightSection={item.rightSection}
//       onClick={() => setActive(index)}
//       variant="subtle"
//     />
//   ))

//   return (
//     <Grid
//       style={{
//         minHeight: "calc(100vh - 92px)",
//         display: "flex",
//       }}
//     >
//       <Grid.Col span={3}>
//         <Paper
//           style={{
//             height: "100%",
//           }}
//           withBorder
//           p="md"
//         >
//           <Box>{items}</Box>
//         </Paper>
//       </Grid.Col>
//       <Grid.Col span={9}>
//         <Paper
//           style={{
//             height: "100%",
//           }}
//           withBorder
//           p="xl"
//         >
//           <Outlet />
//         </Paper>
//       </Grid.Col>
//     </Grid>
//   )
// }
