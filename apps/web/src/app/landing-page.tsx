'use client';

import { LandingLayout } from '@/components/landing/LandingLayout';
import { LandingHeader } from '@/components/landing/landing-header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Comparison } from '@/components/landing/comparison';
import { TemplatesShowcase } from '@/components/landing/templates-showcase';
import { IntegrationGrid } from '@/components/landing/integration-grid';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <LandingLayout>
      <LandingHeader />

      <main>
        <div id="hero">
          <Hero />
        </div>

        {/* <TransitionGrid /> */}

        <div id="features">
          <Features />
        </div>

        <div id="comparison">
          <Comparison />
        </div>

        <div id="templates">
          <TemplatesShowcase />
        </div>

        <div id="integrations">
          <IntegrationGrid />
        </div>
      </main>

      <LandingFooter />
    </LandingLayout>
  );
}
