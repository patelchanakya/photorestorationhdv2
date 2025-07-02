import React from 'react';

export interface ThemeFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

export interface ThemeTestimonial {
  quote: string;
  author: string;
  rating: number;
}

export interface ThemeExample {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
}

export interface ThemeMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface ThemePageConfig {
  slug: string;
  metadata: ThemeMetadata;
  hero: {
    title: string;
    subtitle: string;
    description: string;
  };
  features: ThemeFeature[];
  testimonials: ThemeTestimonial[];
  examples: ThemeExample[];
  ctaSection: {
    title: string;
    description: string;
  };
  faqOverrides?: {
    question: string;
    answer: string;
  }[];
}

export type ThemeSlug = 'wedding' | 'funeral' | 'vintage' | 'family' | 'military' | 'antique';