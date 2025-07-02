import React from 'react';
import Link from 'next/link';
import { Facebook } from 'lucide-react';
import { ThemePageConfig } from '@/types/theme';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";
import FAQSection from '@/components/FAQSection';
import Logo from '@/components/Logo';
import StartRestoringButton from '@/components/StartRestoringButton';
import ThemedPhotoShowcase from '@/components/ThemedPhotoShowcase';
import ThemedTestimonials from '@/components/ThemedTestimonials';

interface ThemePageProps {
  config: ThemePageConfig;
}

export default function ThemePage({ config }: ThemePageProps) {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Logo variant="nav" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="#gallery" className="text-gray-600 hover:text-gray-900">
                Examples
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900">
                FAQ
              </Link>
              <AuthAwareButtons variant="nav" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              {config.hero.title.split(' ').map((word, index, array) => {
                if (index === array.length - 1) {
                  return (
                    <span key={index} className="relative inline-block">
                      <span className="text-primary-600 z-10 relative">{word}</span>
                      <svg className="absolute left-0 right-0 bottom-[-8px] w-full h-3 z-0" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10 Q100 2 190 10" stroke="#D35400" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
                      </svg>
                    </span>
                  );
                }
                return word + ' ';
              })}
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              {config.hero.description}
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <StartRestoringButton variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" id="benefits">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Photo Restoration HD?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.hero.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {config.features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group hover:scale-105 transition-transform duration-200">
                  <div className="flex justify-center mb-6">
                    <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${
                      feature.color === 'text-green-600' ? 'bg-green-100' :
                      feature.color === 'text-blue-600' ? 'bg-blue-100' :
                      feature.color === 'text-purple-600' ? 'bg-purple-100' :
                      feature.color === 'text-red-600' ? 'bg-red-100' :
                      feature.color === 'text-pink-600' ? 'bg-pink-100' :
                      feature.color === 'text-amber-600' ? 'bg-amber-100' : 'bg-gray-100'
                    } group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <ThemedTestimonials testimonials={config.testimonials} />

      <HomePricing />

      <section className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            {config.ctaSection.title}
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            {config.ctaSection.description}
          </p>
          <StartRestoringButton variant="cta" className="mt-8" />
        </div>
      </section>

      <ThemedPhotoShowcase examples={config.examples} />

      <FAQSection />

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Photo Restoration</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="#gallery" className="text-gray-600 hover:text-gray-900">
                    Examples
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-gray-600 hover:text-gray-900">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Shot with photorestorationhd</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/wedding" className="text-gray-600 hover:text-gray-900">
                    Wedding Photos
                  </Link>
                </li>
                <li>
                  <Link href="/family" className="text-gray-600 hover:text-gray-900">
                    Family Memories
                  </Link>
                </li>
                <li>
                  <Link href="/vintage" className="text-gray-600 hover:text-gray-900">
                    Vintage Photos
                  </Link>
                </li>
                <li>
                  <Link href="/military" className="text-gray-600 hover:text-gray-900">
                    Military Service
                  </Link>
                </li>
                <li>
                  <Link href="/funeral" className="text-gray-600 hover:text-gray-900">
                    Memorial Photos
                  </Link>
                </li>
                <li>
                  <Link href="/antique" className="text-gray-600 hover:text-gray-900">
                    Antique Photos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Support</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a 
                    href="https://www.facebook.com/photorestorationhd" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="#benefits" className="text-gray-600 hover:text-gray-900">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Follow Us</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a 
                    href="https://www.facebook.com/photorestorationhd" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600">
                © {new Date().getFullYear()} {productName}. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm mt-2 sm:mt-0">
                Restore your precious memories with the best photo enhancement technology
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}