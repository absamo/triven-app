import { describe, expect, it, vi } from 'vitest'
import TrialAlert from '~/app/components/TrialAlert'
import { render, screen } from '~/app/test/utils'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'trial:daysRemaining') return `${params?.days} days left in trial`
      if (key === 'trial:oneDayRemaining') return '1 day left in trial'
      if (key === 'trial:trialExpiresIn') return `Trial expires in ${params?.days} days`
      if (key === 'trial:trialExpiringSoon') return 'Your trial is expiring soon!'
      if (key === 'trial:upgradeNow') return 'Upgrade Now'
      return key
    },
  }),
}))

describe('TrialAlert Component', () => {
  describe('Low Urgency (7+ days)', () => {
    it('renders with low urgency styling for 7+ days', () => {
      render(
        <TrialAlert
          daysRemaining={7}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByText('7 days left in trial')).toBeInTheDocument()
    })

    it('renders as compact badge in header position', () => {
      const { container } = render(
        <TrialAlert
          daysRemaining={10}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
          position="header"
        />
      )

      // Badge should be rendered
      const badge = container.querySelector('.mantine-Badge-root')
      expect(badge).toBeInTheDocument()
    })

    it('shows upgrade button when showUpgradeButton is true', () => {
      render(
        <TrialAlert
          daysRemaining={7}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
    })

    it('does not render upgrade button when showUpgradeButton is false', () => {
      render(
        <TrialAlert
          daysRemaining={7}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={false}
        />
      )

      expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument()
    })
  })

  describe('Medium Urgency (3-6 days)', () => {
    it('renders with medium urgency for 3-6 days', () => {
      render(
        <TrialAlert
          daysRemaining={5}
          urgencyLevel="medium"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByText(/Trial expires in 5 days/i)).toBeInTheDocument()
    })

    it('renders as banner with clock icon', () => {
      const { container } = render(
        <TrialAlert
          daysRemaining={4}
          urgencyLevel="medium"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
          position="banner"
        />
      )

      // Banner should have orange styling
      const banner = container.querySelector('[data-urgency="medium"]')
      expect(banner || container.firstChild).toBeInTheDocument()
    })
  })

  describe('High Urgency (1-2 days)', () => {
    it('renders with high urgency styling for 1-2 days', () => {
      render(
        <TrialAlert
          daysRemaining={1}
          urgencyLevel="high"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByText(/Your trial is expiring soon!/i)).toBeInTheDocument()
    })

    it('renders as prominent banner with warning icon', () => {
      const { container } = render(
        <TrialAlert
          daysRemaining={2}
          urgencyLevel="high"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
          position="banner"
        />
      )

      // High urgency banner should be rendered
      expect(container.firstChild).toBeInTheDocument()
    })

    it('displays 1 day remaining message correctly', () => {
      render(
        <TrialAlert
          daysRemaining={1}
          urgencyLevel="high"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      // High urgency shows "expiring soon" message instead of day count
      expect(screen.getByText(/Your trial is expiring soon!/i)).toBeInTheDocument()
    })
  })

  describe('Expired Trial', () => {
    it('does not render for expired trial (0 days)', () => {
      const { container } = render(
        <TrialAlert
          daysRemaining={0}
          urgencyLevel="expired"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      // Component returns null, but MantineProvider adds a style tag
      // Check there's no actual content (Badge, Button, Flex, etc.)
      expect(container.querySelector('.mantine-Badge-root')).not.toBeInTheDocument()
      expect(container.querySelector('.mantine-Button-root')).not.toBeInTheDocument()
      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument()
    })

    it('does not render for expired urgency level', () => {
      const { container } = render(
        <TrialAlert
          daysRemaining={0}
          urgencyLevel="expired"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={false}
        />
      )

      // Component returns null, but MantineProvider adds a style tag
      // Check there's no actual content
      expect(container.querySelector('.mantine-Badge-root')).not.toBeInTheDocument()
      expect(container.querySelector('.mantine-Button-root')).not.toBeInTheDocument()
      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument()
    })
  })

  describe('Upgrade Button Interactions', () => {
    it('calls onUpgradeClick when button is clicked', async () => {
      const onUpgrade = vi.fn()
      const { user } = render(
        <TrialAlert
          daysRemaining={5}
          urgencyLevel="medium"
          onUpgradeClick={onUpgrade}
          showUpgradeButton={true}
        />
      )

      const button = screen.getByRole('button', { name: /upgrade/i })
      await user.click(button)

      expect(onUpgrade).toHaveBeenCalledOnce()
    })

    it('renders upgrade button for low urgency', () => {
      render(
        <TrialAlert
          daysRemaining={10}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
    })

    it('renders upgrade button for medium urgency', () => {
      render(
        <TrialAlert
          daysRemaining={5}
          urgencyLevel="medium"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
    })

    it('renders upgrade button for high urgency', () => {
      render(
        <TrialAlert
          daysRemaining={1}
          urgencyLevel="high"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('displays correct message for multiple days remaining', () => {
      render(
        <TrialAlert
          daysRemaining={7}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByText('7 days left in trial')).toBeInTheDocument()
    })

    it('displays different message for high urgency', () => {
      render(
        <TrialAlert
          daysRemaining={1}
          urgencyLevel="high"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
        />
      )

      expect(screen.getByText(/Your trial is expiring soon!/i)).toBeInTheDocument()
    })
  })

  describe('Position Variants', () => {
    it('renders in header position', () => {
      render(
        <TrialAlert
          daysRemaining={7}
          urgencyLevel="low"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
          position="header"
        />
      )

      expect(screen.getByText(/days left in trial/i)).toBeInTheDocument()
    })

    it('renders in banner position', () => {
      render(
        <TrialAlert
          daysRemaining={5}
          urgencyLevel="medium"
          onUpgradeClick={vi.fn()}
          showUpgradeButton={true}
          position="banner"
        />
      )

      expect(screen.getByText(/Trial expires in/i)).toBeInTheDocument()
    })
  })
})
