"use client";

import { useReportWebVitals } from 'next/web-vitals';
import { usePostHog } from 'posthog-js/react';
import { useRef } from 'react';

export function WebVitals() {
    const posthog = usePostHog();
    const reportedMetrics = useRef(new Set<string>());

    useReportWebVitals((metric) => {
        // Create unique key to prevent duplicate reports
        const metricKey = `${metric.name}-${metric.id}`;
        
        // Skip if already reported
        if (reportedMetrics.current.has(metricKey)) {
            return;
        }
        
        // Mark as reported
        reportedMetrics.current.add(metricKey);

        // Track Core Web Vitals with PostHog
        if (posthog) {
            posthog.capture('web_vitals', {
                name: metric.name,
                value: metric.value,
                id: metric.id,
                delta: metric.delta,
                rating: metric.rating,
                navigationType: metric.navigationType || 'unknown'
            });
        }

        // Development logging
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vitals] ${metric.name}:`, {
                value: metric.value,
                rating: metric.rating,
                delta: metric.delta,
                timestamp: Date.now()
            });
        }
    });

    return null;
}