## Project Status Board
- [x] Update right side of login/register layout to show 'Cherished Around the World' and photo restoration testimonials
- [x] Replace testimonials with genuine, emotional, and specific feedback inspired by real customer language
- [x] Overhaul navigation bar (remove template links, add Home, How it Works, Pricing, FAQ, Login/Register)
- [x] Update hero section with new headline, subheadline, and CTA for photo restoration
- [x] Add creative underline SVG accents to hero and gallery section headlines for consistent, beautiful visual style
<<<<<<< HEAD
- [x] Refactor useEffect deps in storage/page.tsx
- [x] Refactor useEffect deps in HowItWorksTour.tsx
- [x] Refactor useEffect deps in useCredits.ts
- [x] Refactor useEffect deps in GlobalContext.tsx
- [x] Replace <img> with <Image/> in PhotoShowcase.tsx
- [x] Replace <img> with <Image/> in storage/page.tsx
- [ ] Verify clean build (no warnings)
=======
>>>>>>> parent of 4ea6e37 (clean compile)

## Executor's Feedback or Assistance Requests
- The testimonials now use authentic, emotional language inspired by real customer feedback from Facebook groups and testimonial sites. Please review the new testimonials for authenticity and emotional impact. Let me know if you want further tweaks or have specific stories to include. 

- The heading now reads 'Cherished Around the World' above the testimonials. Please review and let me know if this is the final version or if you want any more tweaks. 

- Navigation bar and hero section have been updated to match the new homepage plan. Please review the top of the homepage and confirm if you're happy with these changes before I proceed to the next section (before/after gallery).

- Subtle, creative underline accents have been added under 'back to life' and 'transformation' in the hero and gallery sections, matching your brand's color and style. Please review these changes for aesthetics and consistency. Let me know if you want any tweaks or if I should proceed to the next homepage section.

## Background and Motivation (Homepage Improvements)
- The user wants to adjust the homepage (/) which currently contains a lot of boilerplate content. The goal is to make the homepage more unique, engaging, and tailored to the photo restoration service, reducing generic or template-like elements.

## Key Challenges and Analysis (Homepage Improvements)
- Identifying which sections are boilerplate and which are essential for the brand/service.
- Ensuring the homepage clearly communicates the value proposition and emotional impact of photo restoration.
- Balancing information, testimonials, and calls to action for best conversion.
- Maintaining visual consistency with the rest of the site (e.g., login page testimonials, color scheme).

## High-level Task Breakdown (Homepage Improvements)
1. Review the current homepage code to identify boilerplate sections and content.
   - Success: List of all sections/components that are considered boilerplate or generic.
2. Propose a new homepage structure and content plan, focusing on:
   - Unique value proposition
   - Emotional storytelling/testimonials
   - Clear call to action
   - Visuals that showcase before/after results
   - Trust signals (e.g., customer count, security, etc.)
   - Success: Written outline of new homepage structure with section purposes.
3. Get user feedback/approval on the proposed structure and content direction.
   - Success: User confirms or requests changes to the plan.
4. (Executor) Implement the approved homepage changes step by step, testing after each major section.
   - Success: Homepage matches the new plan, passes user review, and all features work as intended.

## Step 1: Boilerplate/Generic Sections Identified in Homepage
- Navigation bar: Links to 'Features', 'Pricing', 'Documentation', and 'Grab This Template' (references a template repo, not your brand)
- Hero section: 'Bootstrap Your SaaS In 5 minutes' (generic SaaS language, not about photo restoration)
- Stats section: 'Active Users', 'Organizations', 'Countries', 'Uptime' (generic SaaS stats, not relevant to photo restoration)
- Features section: 'Robust Authentication', 'File Management', 'User Settings', 'Task Management', 'Legal Documents', 'Cookie Consent' (all SaaS boilerplate, not about photo restoration)
- Pricing section: <HomePricing /> (needs review for relevance)
- CTA section: 'Ready to Transform Your Idea into Reality?' and 'Join thousands of developers building their SaaS...' (generic SaaS, not about photo restoration)
- Footer: Links to template documentation, generic legal links, and product name

## Step 2: Proposed New Homepage Structure & Content Plan

### 1. Navigation Bar
- Logo and simple navigation (Home, How it Works, Pricing, FAQ, Login/Register)
- Remove template/documentation links

### 2. Hero Section
- Headline: Emotional, clear value (e.g., "Bring old photos back to life in seconds")
- Subheadline: Briefly explain what the service does (e.g., "Transform damaged, faded, or low-quality photos into stunning HD images.")
- Primary CTA: "Start Restoring Photos" (button)
- Trust badges or quick stats (e.g., "200,000+ photos restored", "Loved by families worldwide")

### 3. Before/After Gallery
- Interactive sliders showing real restoration results
- Caption: "See the transformation" or similar

### 4. How It Works
- Simple 3-step process (e.g., Upload, Restore, Download)
- Visual icons for each step

### 5. Testimonials
- Real, emotional customer quotes (as used on login page)
- Headline: "Cherished Around the World" or similar

### 6. Pricing Section
- Use your real pricing plans (Try It, Small Batch, Family Album, Archive Pro)
- Emphasize no subscription required, instant results, and value
- Support CTA (e.g., "Message Us on Facebook")

### 7. FAQ
- Address common questions (e.g., "Is my photo safe?", "How long does it take?", "What formats are supported?")

### 8. Footer
- Brand, support email, social links, legal links (privacy, terms)
- Remove template references

---

**Section Purposes:**
- Each section is designed to build trust, show real results, and drive users to try the service.
- Visuals and testimonials create emotional connection.
- Pricing and FAQ remove barriers to purchase.

---

**Next step:**
- Await user feedback/approval on this structure, or proceed to implementation if approved.

## Creative/Aesthetic Direction Note
- Focus on creative, beautiful, and emotionally resonant design for the homepage.
- Use subtle, consistent visual cues (e.g., underlines, color accents, iconography) inspired by the current style (like the underline under 'back to life' and 'transformation').
- Ensure all design choices align with the brand's ICP (Ideal Customer Profile): families, memory keepers, sentimental users, and those seeking to preserve precious moments.
<<<<<<< HEAD
- Prioritize warmth, trust, and a sense of transformation in all visuals and copy.

## Code Quality Cleanup (ESLint & TypeScript Warnings)

### Background and Motivation
After resolving the blocking build errors, the project still compiles with a handful of ESLint warnings:
1. React-hook dependency warnings in several files.
2. `<img>` vs `<Image/>` optimisation warnings.
Cleaning these now prevents future regressions and keeps CI noise low.

### Key Challenges and Analysis
• Each `useEffect` warning needs a case-by-case refactor (add deps or memoise callbacks).
• Converting `<img>` tags requires importing `next/image`, setting explicit `width/height`, and whitelisting remote hosts in `next.config.ts`.
• Must avoid perf regressions—so memoise expensive callbacks rather than blindly adding objects/arrays to dep arrays.

### High-level Task Breakdown
1. storage/page.tsx
   1.1 Create `const hasActiveJobs = …` with `useMemo`.
   1.2 Move `processingJobs.some` expression into variable; add `processingJobs` + memo to deps.
   1.3 Success: no hook warning in that file.
2. HowItWorksTour.tsx
   2.1 Wrap `highlightElement` & `removeAllHighlights` in `useCallback`.
   2.2 Add them to the dep arrays.
   2.3 Success: warnings gone.
3. useCredits.ts & GlobalContext.tsx
   3.1 Memoise `fetchCredits` with `useCallback`.
   3.2 Add to dep arrays.
   3.3 Success: no hook-dependency warnings.
4. Replace `<img>` in PhotoShowcase.tsx & storage/page.tsx
   4.1 Import `next/image` and convert each tag.
   4.2 Add `width`, `height`, `alt`.
   4.3 Update `next.config.ts` with `remotePatterns` for any external domains.
   4.4 Success: no `@next/next/no-img-element` warnings.
5. Run `yarn run build` – build passes with **zero** ESLint errors or warnings.

### Project Status Board (new items)
- [ ] Refactor useEffect deps in storage/page.tsx
- [ ] Refactor useEffect deps in HowItWorksTour.tsx
- [ ] Refactor useEffect deps in useCredits.ts
- [ ] Refactor useEffect deps in GlobalContext.tsx
- [ ] Replace <img> with <Image/> in PhotoShowcase.tsx
- [ ] Replace <img> with <Image/> in storage/page.tsx
- [ ] Verify clean build (no warnings)

### Current Status / Progress Tracking
Refactored `useEffect` dependencies in `storage/page.tsx` using `useMemo` and updated import list. ESLint hook-dependency warning for that file is resolved. Ready for next subtask. 

Refactored `HowItWorksTour.tsx`: wrapped `highlightElement`, `removeAllHighlights`, and `calculateResponsivePosition` in `useCallback`, fixed dependency arrays, resolved all hook warnings. Next: address hook warnings in `useCredits.ts` and `GlobalContext.tsx`. 

Refactored `useCredits` and `GlobalContext` to use `useCallback` and correct dependency arrays; all React hook dependency warnings are resolved. Remaining ESLint warnings pertain only to `<img>` vs `<Image>` conversion in several components. 

## Verify clean build (no warnings)
- [x] Replace <img> with <Image/> in PhotoShowcase.tsx
- [x] Replace <img> with <Image/> in storage/page.tsx
- [x] Verify clean build (no warnings) 
=======
- Prioritize warmth, trust, and a sense of transformation in all visuals and copy. 
>>>>>>> parent of 4ea6e37 (clean compile)
