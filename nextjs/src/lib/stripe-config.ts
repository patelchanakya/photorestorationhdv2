export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
  credits: number;
}

// Live Stripe product configuration
export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_STqx8aYOmjG3LN',
    priceId: 'price_1RYtFaDHBXmKKCsn8MOF5vXf',
    name: 'Duo Pack',
    description: 'Try our instant restoration service.',
    mode: 'payment',
    price: '$2.99',
    credits: 2,
  },
  {
    id: 'prod_STqxQjCuHlnSxK',
    priceId: 'price_1RYtFYDHBXmKKCsnXfZkwhLn',
    name: 'Memories Pack',
    description: 'Perfect for a few important memories',
    mode: 'payment',
    price: '$5.99',
    credits: 5,
  },
  {
    id: 'prod_STqxVMnifr0jjs',
    priceId: 'price_1RYtFWDHBXmKKCsnAc58fVVF',
    name: 'Family Pack',
    description: 'Restore a complete photo collection',
    mode: 'payment',
    price: '$18.99',
    credits: 25,
  },
  {
    id: 'prod_STqxk3ZS3aTnWI',
    priceId: 'price_1RYtFUDHBXmKKCsnR3BIOW6C',
    name: 'Archive Album Pack',
    description: 'For photographers & large collections',
    mode: 'payment',
    price: '$49.99',
    credits: 100,
  },
];

// Credit mapping for webhook processing
export const CREDIT_MAPPING: { [key: string]: number } = {
  'price_1RYtFaDHBXmKKCsn8MOF5vXf': 2,   // Duo Pack
  'price_1RYtFYDHBXmKKCsnXfZkwhLn': 5,   // Memories Pack
  'price_1RYtFWDHBXmKKCsnAc58fVVF': 25,  // Family Pack
  'price_1RYtFUDHBXmKKCsnR3BIOW6C': 100, // Archive Album Pack
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getCreditsByPriceId = (priceId: string): number => {
  return CREDIT_MAPPING[priceId] || 0;
};

// Calculate price per credit for a product
export const getPricePerCredit = (product: StripeProduct): number => {
  const price = parseFloat(product.price.replace('$', ''));
  return price / product.credits;
};

// Calculate savings compared to base price
export const calculateSavings = (product: StripeProduct, baseProduct: StripeProduct): number => {
  const basePricePerCredit = getPricePerCredit(baseProduct);
  const currentPricePerCredit = getPricePerCredit(product);
  return Math.round((basePricePerCredit - currentPricePerCredit) * product.credits);
};

// Get popular and best value products
export const getPopularProduct = (): StripeProduct => {
  return stripeProducts.find(p => p.credits === 25) || stripeProducts[2]; // Family Album
};

export const getBestValueProduct = (): StripeProduct => {
  return stripeProducts.find(p => p.credits === 100) || stripeProducts[3]; // Archive Pro
};