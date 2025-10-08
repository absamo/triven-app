import { Container } from '@mantine/core'
// import { IconArrowLeft } from "@tabler/icons-react"

import classes from '~/app/partials/Container/Container.module.css'

interface ContainerProps {
  children: React.ReactNode
  filterProps?: {
    bill?: boolean
    purchaseOrder?: boolean
    supplier?: boolean
    agency?: boolean
    status?: boolean
  }
}

export default function ContainerPartialPage({ children, filterProps }: ContainerProps) {
  return (
    <>
      <Container size="responsive" className={classes.filterContainer}>
        Filter
      </Container>
      <Container size="responsive" className={classes.tableContainer}>
        {children}
      </Container>
    </>
  )
}
