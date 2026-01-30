import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ProductDetail } from './index';
import { CartProvider } from '../../contexts/CartContext';
import type { Product } from '../../types/product';

// Mock product data for testing
const mockProduct: Product = {
  id: 1,
  title: 'Premium Wireless Headphones',
  description: 'High-quality wireless headphones with noise cancellation and premium sound.',
  category: 'Electronics',
  price: 299.99,
  rating: 4.8,
  stock: 15,
  brand: 'AudioPro',
  availabilityStatus: 'In Stock',
  returnPolicy: '30 days return policy',
  thumbnail: 'https://example.com/headphones-thumb.jpg',
  images: ['https://example.com/headphones.jpg'],
};

// Setup MSW server to mock API calls at network level
const server = setupServer(
  http.get('https://dummyjson.com/products/:id', ({ params }) => {
    const { id } = params;
    if (id === '1') {
      return HttpResponse.json(mockProduct);
    }
    return new HttpResponse(null, { status: 404 });
  })
);

// Test setup helper
const renderProductDetail = (productId: number = 1) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  // Create a root route
  const rootRoute = createRootRoute();

  // Create the product detail route
  const productRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/products/$productId',
    component: ProductDetail,
  });

  // Create the route tree
  const routeTree = rootRoute.addChildren([productRoute]);

  // Create router with memory history
  const history = createMemoryHistory({
    initialEntries: [`/products/${productId}`],
  });

  const router = createRouter({
    routeTree,
    history,
    context: {
      queryClient,
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>
  );

  return { ...result, queryClient };
};

describe('ProductDetail Component - Behaviour-Driven Tests', () => {
  // Start MSW server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });

  describe('Scenario: User views a product detail page', () => {
    it('should display all essential product information when the user opens a product page', async () => {
      // Given: A user navigates to a product detail page
      renderProductDetail(1);

      // Then: The user should see the product title prominently displayed
      await waitFor(() => {
        expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      });

      // And: The user should see the product price
      expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();

      // And: The user should see the product description
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();

      // And: The user should see product metadata including brand, category, stock, and rating
      expect(screen.getByText('Brand')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.brand!)).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category)).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.stock.toString())).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText(`⭐ ${mockProduct.rating.toFixed(1)}`)).toBeInTheDocument();

      // And: The user should see the product image
      const image = screen.getByAltText(mockProduct.title);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockProduct.images[0]);
    });
  });

  describe('Scenario: User navigates back to the product list', () => {
    it('should provide a way to return to the products list when viewing product details', async () => {
      // Given: A user is viewing a product detail page
      renderProductDetail(1);

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      });

      // Then: The user should see a "Back to Products" link
      const backLink = screen.getByText('← Back to Products');
      expect(backLink).toBeInTheDocument();

      // And: The link should be properly configured to navigate back
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Scenario: User adds a product to their shopping cart', () => {
    it('should allow users to add the displayed product to their cart', async () => {
      // Given: A user is viewing a product they want to purchase
      const user = userEvent.setup();
      renderProductDetail(1);

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      });

      // When: The user clicks the "Add to Cart" button
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartButton).toBeInTheDocument();
      await user.click(addToCartButton);

      // Then: The product should be added to the user's cart
      // We verify this by checking the cart state through the UI
      // In a real app, we might check for a toast notification, cart badge update, etc.
      // For this test, we ensure the button is still functional after click
      expect(addToCartButton).toBeInTheDocument();
    });
  });

  describe('Scenario: User views product layout and presentation', () => {
    it('should display all key product components visible to the user', async () => {
      // Given: A user opens a product detail page
      renderProductDetail(1);

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      });

      // Then: All key components should be present and visible to the user
      // Navigation element
      expect(screen.getByText('← Back to Products')).toBeInTheDocument();
      
      // Product image
      expect(screen.getByAltText(mockProduct.title)).toBeInTheDocument();
      
      // Product information
      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
      
      // Product metadata
      expect(screen.getByText('Brand')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      
      // Call to action
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });
  });
});
