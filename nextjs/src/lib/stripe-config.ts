export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
  credits: number;
}

// Actual Stripe product configuration from your Stripe Dashboard (TEST MODE)
export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_STJCDsrT1Ewf83',
    priceId: 'price_1RYMaEDHBXmKKCsnzZK4iqzv',
    name: 'Single Pack',
    description: 'Test our AI restoration on one special photo',
    mode: 'payment',
    price: '$2.99',
    credits: 2,
  },
  {
    id: 'prod_STJE0YWxUhWGWo',
    priceId: 'price_1RYMbzDHBXmKKCsnjXbOyxui',
    name: 'Memories Pack',
    description: 'Perfect for a few important memories',
    mode: 'payment',
    price: '$5.99',
    credits: 5,
  },
  {
    id: 'prod_STJF2nVicaMVXA',
    priceId: 'price_1RYMdJDHBXmKKCsn6BohuUcS',
    name: 'Family Pack',
    description: 'Restore a complete photo collection',
    mode: 'payment',
    price: '$18.99',
    credits: 25,
  },
  {
    id: 'prod_STJGb4axcXktRZ',
    priceId: 'price_1RYMeIDHBXmKKCsnLT3mXJGJ',
    name: 'Archive Album Pack',
    description: 'For photographers & large collections',
    mode: 'payment',
    price: '$49.99',
    credits: 100,
  },
];

// Credit mapping for webhook processing
export const CREDIT_MAPPING: { [key: string]: number } = {
  'price_1RYMaEDHBXmKKCsnzZK4iqzv': 2,   // Single Pack
  'price_1RYMbzDHBXmKKCsnjXbOyxui': 5,   // Memories Pack
  'price_1RYMdJDHBXmKKCsn6BohuUcS': 25,  // Family Pack
  'price_1RYMeIDHBXmKKCsnLT3mXJGJ': 100, // Archive Album Pack
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