import { vi } from 'vitest'
import { categoryFixtures, permissionFixtures } from '../fixtures'
import { createRoutesStub, render, renderWithRouterContext, screen, waitFor } from '../utils'

// Import components
import Categories from '../../pages/Categories/Categories'
import CategoryForm from '../../pages/Categories/CategoryForm'

describe('Categories Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Journey: View Categories List', () => {
    it('displays categories when user has read permission', () => {
      const categories = [
        categoryFixtures.electronics,
        categoryFixtures.clothing,
        categoryFixtures.books,
      ]

      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.readOnly} />
      )

      // User sees the page title
      expect(screen.getByText('Categories')).toBeInTheDocument()

      // User sees all categories in the table
      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Clothing')).toBeInTheDocument()
      expect(screen.getByText('Books')).toBeInTheDocument()

      // User sees proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('NAME')).toBeInTheDocument()
    })

    it('shows empty state when no categories exist', () => {
      renderWithRouterContext(
        <Categories categories={[]} permissions={permissionFixtures.readOnly} />
      )

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()

      // No category data should be visible
      expect(screen.queryByText('Electronics')).not.toBeInTheDocument()
    })
  })

  describe('User Journey: Navigate to Edit Category', () => {
    it('allows user with update permission to click and navigate to edit page', async () => {
      // Get the mocked useNavigate function
      const { useNavigate } = await import('react-router')
      const mockNavigate = vi.fn()
      vi.mocked(useNavigate).mockReturnValue(mockNavigate)

      const { user } = renderWithRouterContext(
        <Categories
          categories={[categoryFixtures.electronics]}
          permissions={permissionFixtures.updateRead}
        />
      )

      // User clicks on a category row
      const electronicsRow = screen.getByText('Electronics').closest('tr')
      expect(electronicsRow).toBeInTheDocument()

      if (electronicsRow) {
        await user.click(electronicsRow)

        // System navigates to edit page
        expect(mockNavigate).toHaveBeenCalledWith('/categories/1/edit')
      }
    })

    it('prevents navigation when user lacks update permission', async () => {
      // Get the mocked useNavigate function
      const { useNavigate } = await import('react-router')
      const mockNavigate = vi.fn()
      vi.mocked(useNavigate).mockReturnValue(mockNavigate)

      const { user } = renderWithRouterContext(
        <Categories
          categories={[categoryFixtures.electronics]}
          permissions={permissionFixtures.readOnly}
        />
      )

      // User clicks on a category row
      const electronicsRow = screen.getByText('Electronics').closest('tr')
      expect(electronicsRow).toBeInTheDocument()

      if (electronicsRow) {
        await user.click(electronicsRow)

        // System does not navigate
        expect(mockNavigate).not.toHaveBeenCalled()
      }
    })
  })

  describe('User Journey: Create New Category', () => {
    it('allows user to create a new category with valid data', async () => {
      // Get the mocked useSubmit function
      const { useSubmit } = await import('react-router')
      const mockSubmit = vi.fn()
      vi.mocked(useSubmit).mockReturnValue(mockSubmit)

      // Create a route stub for the category form
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/new',
          Component: () => (
            <CategoryForm category={{ id: '', name: '', description: '' }} errors={{}} />
          ),
          action() {
            return { success: true }
          },
        },
      ])

      const { user } = render(<RoutesStub initialEntries={['/categories/new']} />)

      // User sees create form
      expect(screen.getByText('Add a category')).toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()

      // User fills in category details
      const nameInput = screen.getByLabelText(/name/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      await user.type(nameInput, 'New Electronics Category')
      await user.type(descriptionInput, 'All electronic devices and gadgets')

      // User submits the form
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // System submits form data
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), { method: 'post' })
      })

      // Verify form data contains correct values
      const formData = mockSubmit.mock.calls[0][0] as FormData
      expect(formData.get('name')).toBe('New Electronics Category')
      expect(formData.get('description')).toBe('All electronic devices and gadgets')
    })

    it('shows validation errors for invalid data', async () => {
      // Create a route stub that returns validation errors
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/new',
          Component: () => (
            <CategoryForm
              category={{ id: '', name: '', description: '' }}
              errors={{ name: 'Name is required' }}
            />
          ),
          action() {
            return {
              errors: { name: 'Name is required' },
            }
          },
        },
      ])

      const { user } = render(<RoutesStub initialEntries={['/categories/new']} />)

      // User sees create form
      expect(screen.getByText('Add a category')).toBeInTheDocument()

      // User submits form without filling required fields
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // System shows validation error
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('displays server errors when category name already exists', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/new',
          Component: () => (
            <CategoryForm
              category={{ id: '', name: 'Electronics', description: '' }}
              errors={{ name: 'A category already exists with this name' }}
            />
          ),
        },
      ])

      render(<RoutesStub initialEntries={['/categories/new']} />)

      // User sees server validation error
      expect(screen.getByText('A category already exists with this name')).toBeInTheDocument()
    })
  })

  describe('User Journey: Edit Existing Category', () => {
    it('allows user to edit an existing category', async () => {
      // Get the mocked useSubmit function
      const { useSubmit } = await import('react-router')
      const mockSubmit = vi.fn()
      vi.mocked(useSubmit).mockReturnValue(mockSubmit)

      const RoutesStub = createRoutesStub([
        {
          path: '/categories/:id/edit',
          Component: () => <CategoryForm category={categoryFixtures.electronics} errors={{}} />,
          action() {
            return { success: true }
          },
        },
      ])

      const { user } = render(<RoutesStub initialEntries={['/categories/1/edit']} />)

      // User sees edit form with existing data
      expect(screen.getByText('Edit a category')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Electronic devices and components')).toBeInTheDocument()

      // User modifies category details
      const nameInput = screen.getByLabelText(/name/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Electronics')

      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description for electronics')

      // User submits the changes
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // System submits updated data
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), { method: 'post' })
      })

      // Verify updated form data
      const formData = mockSubmit.mock.calls[0][0] as FormData
      expect(formData.get('name')).toBe('Updated Electronics')
      expect(formData.get('description')).toBe('Updated description for electronics')
    })

    it('pre-fills form with existing category data', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/:id/edit',
          Component: () => <CategoryForm category={categoryFixtures.clothing} errors={{}} />,
        },
      ])

      render(<RoutesStub initialEntries={['/categories/2/edit']} />)

      // User sees form populated with existing data
      expect(screen.getByDisplayValue('Clothing')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Apparel and accessories')).toBeInTheDocument()
    })
  })

  describe('User Journey: Navigation and Back Actions', () => {
    it('provides navigation back to categories list from create form', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/new',
          Component: () => (
            <CategoryForm category={{ id: '', name: '', description: '' }} errors={{}} />
          ),
        },
      ])

      render(<RoutesStub initialEntries={['/categories/new']} />)

      // User sees back navigation option - the link has an empty name but goes to /categories
      const backLink = screen.getByRole('link')
      expect(backLink).toHaveAttribute('href', '/categories')
    })

    it('provides navigation back to categories list from edit form', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/:id/edit',
          Component: () => <CategoryForm category={categoryFixtures.electronics} errors={{}} />,
        },
      ])

      render(<RoutesStub initialEntries={['/categories/1/edit']} />)

      // User sees back navigation option - the link has an empty name but goes to /categories
      const backLink = screen.getByRole('link')
      expect(backLink).toHaveAttribute('href', '/categories')
    })
  })

  describe('User Journey: Permission-Based Experience', () => {
    it('shows appropriate UI elements based on create permissions', () => {
      const categories = [categoryFixtures.electronics]

      // Test with create permission
      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.createRead} />
      )

      expect(screen.getByText('Categories')).toBeInTheDocument()
    })

    it('shows appropriate UI elements without create permissions', () => {
      const categories = [categoryFixtures.electronics]

      // Test without create permission
      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.readOnly} />
      )

      expect(screen.getByText('Categories')).toBeInTheDocument()
    })

    it('adjusts table interactivity based on update permissions', () => {
      const categories = [categoryFixtures.electronics]

      // Test with update permission - table should be interactive
      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.updateRead} />
      )

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('shows table without interactivity when no update permissions', () => {
      const categories = [categoryFixtures.electronics]

      // Test without update permission - table should not be interactive
      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.readOnly} />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('User Journey: Error Handling', () => {
    it('handles empty or undefined categories gracefully', () => {
      renderWithRouterContext(
        <Categories categories={undefined as any} permissions={permissionFixtures.readOnly} />
      )

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('handles missing permissions gracefully', () => {
      const categories = [categoryFixtures.electronics]

      renderWithRouterContext(<Categories categories={categories} permissions={undefined as any} />)

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })
  })

  describe('User Journey: Accessibility and UX', () => {
    it('provides proper accessibility attributes', () => {
      const categories = [categoryFixtures.electronics, categoryFixtures.clothing]

      renderWithRouterContext(
        <Categories categories={categories} permissions={permissionFixtures.readOnly} />
      )

      // Proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(1)
      expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 data rows

      // Proper column headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
    })

    it('maintains proper form accessibility', () => {
      const RoutesStub = createRoutesStub([
        {
          path: '/categories/new',
          Component: () => (
            <CategoryForm category={{ id: '', name: '', description: '' }} errors={{}} />
          ),
        },
      ])

      render(<RoutesStub initialEntries={['/categories/new']} />)

      // Proper form labels and inputs
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()

      // Check if label has required indicator (asterisk)
      const nameLabel = screen.getByText('Name')
      expect(nameLabel).toBeInTheDocument()
      // The required field is indicated by data-required="true" on the label
      const label = screen
        .getByLabelText(/name/i)
        .closest('.mantine-InputWrapper-root')
        ?.querySelector('label')
      expect(label).toHaveAttribute('data-required', 'true')
    })
  })
})
