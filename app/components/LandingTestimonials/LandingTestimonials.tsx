// Landing Testimonials Component
// User Story 3: Social Proof and Trust Building
// Displays customer testimonials with photos and ratings

import { Avatar, Container, Paper, Rating, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { Testimonial } from '~/app/lib/landing/types'
import classes from './LandingTestimonials.module.css'

interface LandingTestimonialsProps {
  testimonials?: Testimonial[]
}

export function LandingTestimonials({ testimonials = [] }: LandingTestimonialsProps) {
  if (testimonials.length === 0) return null

  return (
    <section className={classes.section} aria-label="Customer testimonials">
      <Container size="lg">
        <Stack gap="xl">
          <Title className={classes.title} order={2} ta="center">
            What Our Customers Say
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" className={classes.grid}>
            {testimonials.map((testimonial, index) => (
              <Paper
                key={testimonial.id}
                className={classes.testimonialCard}
                p="xl"
                radius="md"
                withBorder
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Stack gap="md">
                  {/* Star Rating */}
                  <Rating value={testimonial.starRating} readOnly size="sm" />

                  {/* Testimonial Text */}
                  <Text className={classes.testimonialText} size="sm">
                    "{testimonial.testimonialText}"
                  </Text>

                  {/* Customer Info */}
                  <Stack gap="xs" className={classes.customerInfo}>
                    <div className={classes.customerHeader}>
                      <Avatar
                        src={testimonial.photoUrl}
                        alt={testimonial.customerName}
                        radius="xl"
                        size="md"
                        className={classes.avatar}
                      >
                        {testimonial.customerName.charAt(0)}
                      </Avatar>
                      <div>
                        <Text className={classes.customerName} fw={600} size="sm">
                          {testimonial.isPlaceholder ? 'Early Adopter' : testimonial.customerName}
                        </Text>
                        <Text className={classes.customerRole} size="xs" c="dimmed">
                          {testimonial.role}
                        </Text>
                        <Text className={classes.customerCompany} size="xs" c="dimmed">
                          {testimonial.company}
                        </Text>
                      </div>
                    </div>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </section>
  )
}
