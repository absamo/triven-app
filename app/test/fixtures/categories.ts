import type { ICategory } from '../../common/validations/categorySchema'

/**
 * Category test fixtures for consistent test data across all test suites
 */
export const categoryFixtures = {
    /**
     * Standard category with all required fields
     */
    electronics: {
        id: '1',
        name: 'Electronics',
        description: 'Electronic devices and components',
        active: true,
    } as ICategory,

    /**
     * Standard category with different data
     */
    clothing: {
        id: '2',
        name: 'Clothing',
        description: 'Apparel and accessories',
        active: true,
    } as ICategory,

    /**
     * Inactive category for testing status handling
     */
    books: {
        id: '3',
        name: 'Books',
        description: 'Books and literature',
        active: false,
    } as ICategory,

    /**
     * Category with minimal data (no description)
     */
    minimal: {
        id: '4',
        name: 'Minimal Category',
        active: true,
    } as ICategory,

    /**
     * Category without ID for testing edge cases
     */
    withoutId: {
        name: 'No ID Category',
        description: 'Category without ID',
        active: true,
    } as ICategory,

    /**
     * Category with very long name for testing display limits
     */
    longName: {
        id: '5',
        name: 'This is a very long category name that might cause display issues in the UI',
        description: 'Category with an extremely long name for testing purposes',
        active: true,
    } as ICategory,

    /**
     * Category with empty description
     */
    emptyDescription: {
        id: '6',
        name: 'Empty Description',
        description: '',
        active: true,
    } as ICategory,

    /**
     * Category with special characters
     */
    specialChars: {
        id: '7',
        name: 'Special & Characters! @#$%',
        description: 'Category with special characters: &<>"\'/\\',
        active: true,
    } as ICategory,
}

/**
 * Pre-built arrays of categories for different test scenarios
 */
export const categoriesArrays = {
    /**
     * Standard set of 3 categories for most tests
     */
    standard: [
        categoryFixtures.electronics,
        categoryFixtures.clothing,
        categoryFixtures.books,
    ],

    /**
     * Empty array for testing empty state
     */
    empty: [],

    /**
     * Single category for focused tests
     */
    single: [categoryFixtures.electronics],

    /**
     * Mix of active and inactive categories
     */
    mixed: [
        categoryFixtures.electronics,
        categoryFixtures.books, // inactive
        categoryFixtures.clothing,
        categoryFixtures.minimal,
    ],

    /**
     * Only active categories
     */
    activeOnly: [
        categoryFixtures.electronics,
        categoryFixtures.clothing,
        categoryFixtures.minimal,
    ],

    /**
     * Only inactive categories
     */
    inactiveOnly: [
        categoryFixtures.books,
    ],

    /**
     * Categories with edge cases
     */
    edgeCases: [
        categoryFixtures.withoutId,
        categoryFixtures.longName,
        categoryFixtures.emptyDescription,
        categoryFixtures.specialChars,
    ],

    /**
     * Large dataset for performance testing
     */
    large: Array.from({ length: 50 }, (_, index) => ({
        id: `category-${index + 1}`,
        name: `Category ${index + 1}`,
        description: `Description for category ${index + 1}`,
        active: index % 3 !== 0, // Mix of active/inactive
    })) as ICategory[],
}

/**
 * Permission fixtures for testing different user access levels
 */
export const permissionFixtures = {
    /**
     * Full permissions - can create, read, update, delete
     */
    full: [
        'create:categories',
        'read:categories',
        'update:categories',
        'delete:categories',
    ],

    /**
     * Read-only permissions
     */
    readOnly: ['read:categories'],

    /**
     * Create and read permissions
     */
    createRead: ['create:categories', 'read:categories'],

    /**
     * Update and read permissions
     */
    updateRead: ['update:categories', 'read:categories'],

    /**
     * No permissions
     */
    none: [],

    /**
     * Only create permission
     */
    createOnly: ['create:categories'],

    /**
     * Only update permission
     */
    updateOnly: ['update:categories'],

    /**
     * Only delete permission
     */
    deleteOnly: ['delete:categories'],
}

/**
 * Helper function to create a category with custom overrides
 */
export function createCategoryFixture(overrides: Partial<ICategory> = {}): ICategory {
    return {
        ...categoryFixtures.electronics,
        ...overrides,
    }
}

/**
 * Helper function to create an array of categories with custom count
 */
export function createCategoriesArray(count: number, baseCategory: ICategory = categoryFixtures.electronics): ICategory[] {
    return Array.from({ length: count }, (_, index) => ({
        ...baseCategory,
        id: `${baseCategory.id || 'category'}-${index + 1}`,
        name: `${baseCategory.name} ${index + 1}`,
        description: `${baseCategory.description || 'Description'} ${index + 1}`,
    }))
}

/**
 * Mock props for Categories component with different scenarios
 */
export const categoriesComponentProps = {
    /**
     * Standard props with full permissions
     */
    standard: {
        categories: categoriesArrays.standard,
        permissions: permissionFixtures.full,
    },

    /**
     * Read-only props
     */
    readOnly: {
        categories: categoriesArrays.standard,
        permissions: permissionFixtures.readOnly,
    },

    /**
     * No permissions
     */
    noPermissions: {
        categories: categoriesArrays.standard,
        permissions: permissionFixtures.none,
    },

    /**
     * Empty categories
     */
    empty: {
        categories: categoriesArrays.empty,
        permissions: permissionFixtures.full,
    },

    /**
     * Single category with update permissions
     */
    singleWithUpdate: {
        categories: categoriesArrays.single,
        permissions: permissionFixtures.updateRead,
    },

    /**
     * Edge cases data
     */
    edgeCases: {
        categories: categoriesArrays.edgeCases,
        permissions: permissionFixtures.full,
    },

    /**
     * Large dataset
     */
    large: {
        categories: categoriesArrays.large,
        permissions: permissionFixtures.full,
    },
}
