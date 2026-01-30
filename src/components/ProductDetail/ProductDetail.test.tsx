import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProductDetail } from './index';
import type { Product } from '../../types/product';

// Mock the hooks used by child components
vi.mock('../../hooks/useProduct', () => ({
  useProduct: vi.fn(),
}));

vi.mock('../../contexts/useCartContext', () => ({
  useCartContext: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: vi.fn(),
}));

import { useProduct } from '../../hooks/useProduct';
import { useCartContext } from '../../contexts/useCartContext';

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

// Test setup helper
const setupProductDetailTest = (
  product: Product | null = mockProduct,
  addToCart = vi.fn()
) => {
  vi.mocked(useProduct).mockReturnValue({
    data: product,
    isLoading: false,
    error: null,
  } as any);

  vi.mocked(useCartContext).mockReturnValue({
    addToCart,
    cart: [],
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  });

  return { addToCart };
};

describe('ProductDetail Component - Behaviour-Driven Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: User views a product detail page', () => {
    it('should display all essential product information when the user opens a product page', () => {
      // Given: A user navigates to a product detail page
      setupProductDetailTest(mockProduct);
      render(<ProductDetail />);

      // Then: The user should see the product title prominently displayed
      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();

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
    it('should provide a way to return to the products list when viewing product details', () => {
      // Given: A user is viewing a product detail page
      setupProductDetailTest(mockProduct);
      render(<ProductDetail />);

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
      const { addToCart } = setupProductDetailTest(mockProduct);
      render(<ProductDetail />);

      // When: The user clicks the "Add to Cart" button
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartButton).toBeInTheDocument();
      await user.click(addToCartButton);

      // Then: The product should be added to the user's cart
      expect(addToCart).toHaveBeenCalledTimes(1);
      expect(addToCart).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('Scenario: User views product layout and presentation', () => {
    it('should display product details in a well-structured and visually organized layout', () => {
      // Given: A user opens a product detail page
      setupProductDetailTest(mockProduct);
      const { container } = render(<ProductDetail />);

      // Then: The page should have a structured container layout
      const containerDiv = container.querySelector('[class*="container"]');
      expect(containerDiv).toBeInTheDocument();

      // And: The product content should be organized in a grid layout
      const productDiv = container.querySelector('[class*="product"]');
      expect(productDiv).toBeInTheDocument();

      // And: The information section should group related details together
      const infoSection = container.querySelector('[class*="infoSection"]');
      expect(infoSection).toBeInTheDocument();

      // And: All key components should be present and visible to the user
      expect(screen.getByText('← Back to Products')).toBeInTheDocument();
      expect(screen.getByAltText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });
  });
});
