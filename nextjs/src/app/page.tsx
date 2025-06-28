import React from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Shield, Users, Key, Database, Clock } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";
import FAQSection from '@/components/FAQSection';

export default function Home() {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

  const features = [
    {
      icon: Shield,
      title: 'Robust Authentication',
      description: 'Secure login with email/password, Multi-Factor Authentication, and SSO providers',
      color: 'text-green-600'
    },
    {
      icon: Database,
      title: 'File Management',
      description: 'Built-in file storage with secure sharing, downloads, and granular permissions',
      color: 'text-orange-600'
    },
    {
      icon: Users,
      title: 'User Settings',
      description: 'Complete user management with password updates, MFA setup, and profile controls',
      color: 'text-red-600'
    },
    {
      icon: Clock,
      title: 'Task Management',
      description: 'Built-in todo system with real-time updates and priority management',
      color: 'text-teal-600'
    },
    {
      icon: Globe,
      title: 'Legal Documents',
      description: 'Pre-configured privacy policy, terms of service, and refund policy pages',
      color: 'text-purple-600'
    },
    {
      icon: Key,
      title: 'Cookie Consent',
      description: 'GDPR-compliant cookie consent system with customizable preferences',
      color: 'text-blue-600'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Organizations', value: '2K+' },
    { label: 'Countries', value: '50+' },
    { label: 'Uptime', value: '99.9%' }
  ];

  return (
      <div className="min-h-screen">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {productName}
              </span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                  How it Works
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

        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Bring old photos <span className="relative inline-block">
                  <span className="text-primary-600 z-10 relative">back to life</span>
                  <svg className="absolute left-0 right-0 bottom-[-8px] w-full h-3 z-0" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10 Q100 2 190 10" stroke="#D35400" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
                  </svg>
                </span> in seconds
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Transform damaged, faded, or low-quality photos into stunning HD images.
              </p>
              <div className="mt-10 flex gap-4 justify-center">
                <Link href="/auth/register" className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors text-lg shadow">
                  Start Restoring Photos
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl font-bold text-primary-600">{stat.value}</div>
                    <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - replaced with concise, relevant value props */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50" id="benefits">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                    <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v7a2 2 0 002 2h1" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Fast processing</h3>
                <p className="text-gray-600">Results within seconds</p>
              </div>
              <div>
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">HD quality results</h3>
                <p className="text-gray-600">Up to 4K resolution</p>
              </div>
              <div>
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                    <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4m0 0a4 4 0 100-8 4 4 0 000 8z" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure storage</h3>
                <p className="text-gray-600">Enterprise-grade security</p>
              </div>
            </div>
          </div>
        </section>

        <HomePricing />

        <section className="py-24 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Transform Your Idea into Reality?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Join thousands of developers building their SaaS with {productName}
            </p>
            <Link
                href="/auth/register"
                className="mt-8 inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary-600 font-medium hover:bg-primary-50 transition-colors"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="py-24 bg-white" id="gallery">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                See the <span className="relative inline-block">
                  <span className="text-primary-600 z-10 relative">transformation</span>
                  <svg className="absolute left-0 right-0 bottom-0 w-full h-2 z-0" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 8 Q100 15 195 8" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </span>
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Real results from real photos. Drag the slider to reveal the restoration magic.
              </p>
            </div>
            {/* Gallery content here */}
          </div>
        </section>

        <footer className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Product</h4>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="#features" className="text-gray-600 hover:text-gray-900">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Resources</h4>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="https://github.com/Razikus/supabase-nextjs-template" className="text-gray-600 hover:text-gray-900">
                      Documentation
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600">
                © {new Date().getFullYear()} {productName}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        <div id="faq">
          <FAQSection />
        </div>
      </div>
  );
}