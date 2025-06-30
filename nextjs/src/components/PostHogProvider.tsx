"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development"
    const enableVerbose = process.env.NEXT_PUBLIC_POSTHOG_DEV_VERBOSE === "true"
    
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: 'history_change',
      capture_pageleave: true, // Enable pageleave capture
      capture_exceptions: true, // Error tracking for debugging
      debug: isDevelopment,
      
      // Business-focused analytics: disable noisy features for cleaner, cost-effective tracking
      // Focus on pageviews, custom events (registrations, purchases, restorations), and exceptions
      disable_session_recording: !enableVerbose, // Disabled by default (privacy + cost savings)
      autocapture: enableVerbose, // Disabled by default (reduces noise, use custom events instead)
      enable_heatmaps: enableVerbose, // Disabled by default (not needed for straightforward UX)
      capture_performance: enableVerbose, // Disabled by default (enable if performance issues arise)
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
