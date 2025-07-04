import React from 'react';
import Link from 'next/link';
import { Shield, Database, Clock, Facebook } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";
import FAQSection from '@/components/FAQSection';
import PhotoShowcase from '@/components/PhotoShowcase';
import Logo from '@/components/Logo';
import StartRestoringButton from '@/components/StartRestoringButton';
import PromoBanner from '@/components/PromoBanner';

export default function Home() {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

  const features = [
    {
      icon: Clock,
      title: 'Lightning Fast',
      description: 'Get your restored photos in seconds, not hours',
      color: 'text-green-600'
    },
    {
      icon: Database,
      title: 'Secure & Private',
      description: 'Your photos are private and you can delete them permanently whenever you want',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'HD Quality',
      description: 'Restore blurry or black & white photos to sharp, vibrant quality',
      color: 'text-blue-600'
    }
  ];


  return (
      <div className="min-h-screen">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <Logo variant="nav" />
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                <AuthAwareButtons variant="nav" />
              </div>
            </div>
          </div>
        </nav>

        {/* <PromoBanner className="mt-16" /> */}

        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Restore <span className="relative inline-block">
                  <span className="text-primary-600 z-10 relative">any photo</span>
                  <svg className="absolute left-0 right-0 bottom-[-8px] w-full h-3 z-0" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10 Q100 2 190 10" stroke="#D35400" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
                  </svg>
                </span> in seconds
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Transform damaged, faded, or low-quality photos into stunning HD images with professional restoration technology.
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
                Professional-grade restoration that brings your precious memories back to life in seconds - at a fraction of traditional restoration costs ($50-200 per photo)
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="group hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-center mb-6">
                      <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${
                        feature.color === 'text-green-600' ? 'bg-green-100' :
                        feature.color === 'text-blue-600' ? 'bg-blue-100' : 'bg-purple-100'
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
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600">
                Real stories from people who restored their precious memories
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                  Finally got around to scanning all those old family photos. The restoration was incredible, my mom couldn&apos;t believe how clear they turned out.
                </blockquote>
                <div className="text-gray-500 font-medium">— Sarah M.</div>
              </div>

              <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                  &ldquo;Had some WWII photos from my dad that were pretty beat up. This service brought them back to life, the details are amazing.&rdquo;
                </blockquote>
                <div className="text-gray-500 font-medium">— Mike R.</div>
              </div>

              <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                  &ldquo;Found a box of old Polaroids in the attic. Turned the best ones into canvas prints for the living room, they look fantastic.&rdquo;
                </blockquote>
                <div className="text-gray-500 font-medium">— Lisa T.</div>
              </div>
            </div>
          </div>
        </section>

        <HomePricing />

        <section className="py-24 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Restore Your Precious Memories?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Join thousands of users who have already restored their treasured family photos
            </p>
            <StartRestoringButton variant="cta" className="mt-8" />
          </div>
        </section>

        <PhotoShowcase />

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
                <h4 className="text-sm font-semibold text-gray-900">Shot with Photo Restoration HD</h4>
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