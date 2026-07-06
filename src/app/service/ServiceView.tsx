'use client';

import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import './service.css';

interface ServiceViewProps {
  services: any[];
  pricingPlans: any[];
  faqs: any[];
  serviceDescription: string;
}

const serviceAccentColors = [
  "var(--btn-orange)",
  "var(--btn-cyan)",
  "var(--btn-teal)",
  "var(--btn-lime)",
  "var(--btn-blue)",
  "var(--btn-yellow)",
  "var(--btn-red)",
  "var(--btn-green)",
];

const serviceAccentStyle = (index: number) => ({
  "--service-color": serviceAccentColors[index % serviceAccentColors.length],
}) as React.CSSProperties;

export default function ServiceView({ services, pricingPlans, faqs, serviceDescription }: ServiceViewProps) {
  const [activeTab, setActiveTab] = useState(services[0]?.id || 'performance');
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const pricingRef = useRef<HTMLDivElement | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleScrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <main className="gear-page">
      <div className="gear-container">
        {/* HERO */}
        <section className="gear-hero about-reveal-hero toki-r" data-d="1" aria-label="Services introduction">
          <div className="page-kicker-wrapper">
            <span className="page-kicker-text">My Services</span>
          </div>
          <AnimatedPageHeadline
            className="hero-title hero-title--animated"
            headline="<em>Acquisition</em>, tracking, and fast websites."
          />
          <p className="gear-intro">{serviceDescription}</p>
          <ul className="hero-proof-list" aria-label="Primary service outcomes">
            <li>Paid acquisition</li>
            <li>Server-side measurement</li>
            <li>SEO-ready builds</li>
          </ul>
          <div className="hero-ctas">
            <a href="mailto:hi@loc.digital" className="btn btn-primary">
              Book a discovery call <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <button className="btn btn-secondary" onClick={handleScrollToPricing}>
              Explore Retainers
            </button>
          </div>
        </section>

        {/* TRUST LOGOS */}
        <div className="client-strip">
          <span className="strip-label">Powering workflows across major digital sectors:</span>
          <div className="marquee-container">
            <div className="marquee-track">
              <div className="marquee-group">
                <span>E-Commerce</span><span className="separator">✦</span>
                <span>Consumer Brands</span><span className="separator">✦</span>
                <span>SaaS Products</span><span className="separator">✦</span>
                <span>Mobile Apps</span><span className="separator">✦</span>
                <span>B2B Marketplaces</span><span className="separator">✦</span>
                <span>Fintech Services</span><span className="separator">✦</span>
                <span>AI Platforms</span><span className="separator">✦</span>
                <span>Creative Studios</span><span className="separator">✦</span>
                <span>Web3 Protocols</span>
              </div>
              <div className="marquee-group" aria-hidden="true">
                <span className="separator">✦</span>
                <span>E-Commerce</span><span className="separator">✦</span>
                <span>Consumer Brands</span><span className="separator">✦</span>
                <span>SaaS Products</span><span className="separator">✦</span>
                <span>Mobile Apps</span><span className="separator">✦</span>
                <span>B2B Marketplaces</span><span className="separator">✦</span>
                <span>Fintech Services</span><span className="separator">✦</span>
                <span>AI Platforms</span><span className="separator">✦</span>
                <span>Creative Studios</span><span className="separator">✦</span>
                <span>Web3 Protocols</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN FEATURES GRID */}
        <section className="features-section toki-r" data-d="2">
          <div className="section-header">
            <h2 className="section-title">A practical stack for acquisition, trust, and delivery</h2>
            <p className="section-desc">Each service is scoped around the operating work that moves revenue: setup, execution, measurement, and iteration.</p>
          </div>

          <div className="saas-grid">
            {services.map((service) => (
              <div className="saas-card" key={service.id}>
                <div className="card-header">
                  <span className="card-num">{service.num}</span>
                  <span className="card-metric">{service.metric}</span>
                </div>
                <h3 className="card-title">{service.title}</h3>
                <p className="card-desc">{service.desc}</p>

                <div className="card-checklist-header">Included</div>
                <ul className="card-checklist">
                  {service.checklist.map((item: string, idx: number) => (
                    <li key={idx}>
                      <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="card-tags">
                  {service.tags.map((tag: string) => (
                    <span className="card-tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CAPABILITIES DASHBOARD */}
        <section className="capabilities-dashboard toki-r" data-d="3">
          <div className="section-header">
            <h2 className="section-title">How the work gets executed</h2>
            <p className="section-desc">Pick a lane to see the actual operating tasks behind the service.</p>
          </div>

          <div className="dashboard-container">
            {/* Left Tab Selectors */}
            <div className="dashboard-tabs" role="tablist" aria-label="Service capabilities">
              {services.map((service, index) => {
                const active = activeTab === service.id;
                return (
                  <button 
                    className={`tab-button ${active ? 'active' : ''}`}
                    key={service.id}
                    id={`tab-${service.id}`}
                    role="tab"
                    aria-controls={`pane-${service.id}`}
                    aria-selected={active ? "true" : "false"}
                    onClick={() => setActiveTab(service.id)}
                    style={serviceAccentStyle(index)}
                  >
                    <span className="tab-num">{service.num}</span>
                    <span className="tab-title">{service.title}</span>
                    <ArrowRight className="tab-arrow" size={16} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {/* Right Content Frame */}
            <div className="dashboard-content-panel">
              {services.map((service, index) => {
                const active = activeTab === service.id;
                return (
                  <div 
                    className={`tab-pane ${active ? 'active' : ''}`}
                    key={service.id}
                    id={`pane-${service.id}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${service.id}`}
                    tabIndex={0}
                    style={{
                      display: active ? 'block' : 'none',
                      ...serviceAccentStyle(index),
                    }}
                  >
                    <div className="pane-split">
                      <div className="pane-info">
                        <div className="pane-meta">
                          <span className="pane-kicker">{service.kicker}</span>
                          <span className="pane-badge">{service.metric}</span>
                        </div>
                        <h3 className="pane-title">How I execute: {service.title}</h3>
                        <p className="pane-desc">{service.desc}</p>
                        
                        <div className="pane-cap-list">
                          {service.capabilities.map((cap: any, idx: number) => (
                            <div className="pane-cap-item" key={idx}>
                              <div className="pane-cap-header">
                                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="pane-cap-name">{cap.name}</span>
                              </div>
                              <p className="pane-cap-desc">{cap.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING TIERS SECTION */}
        <section className="pricing-section toki-r" data-d="4" id="pricing-block" ref={pricingRef}>
          <div className="section-header">
            <h2 className="section-title">Simple, flat-rate pricing models</h2>
            <p className="section-desc">No agency percentages. No complex sales loops. Pick the format that fits your pace.</p>
            
            {/* Billing Toggle */}
            <div className="pricing-toggle-container">
              <span className="toggle-label">Monthly Retainer</span>
              <button 
                className={`pricing-toggle-btn ${isProjectMode ? 'active' : ''}`}
                id="billing-toggle" 
                type="button" 
                aria-label="Toggle billing duration" 
                aria-pressed={isProjectMode ? "true" : "false"}
                onClick={() => setIsProjectMode(!isProjectMode)}
              >
                <span className="toggle-slider"></span>
              </button>
              <span className="toggle-label">One-Time Project</span>
            </div>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div className={`pricing-card ${plan.popular ? 'popular' : ''}`} key={plan.title}>
                {plan.popular && <span className="popular-badge">RECOMMENDED</span>}
                <div className="plan-header">
                  <span className="plan-tag">{plan.tag}</span>
                  <h3 className="plan-title">{plan.title}</h3>
                  <p className="plan-desc">{plan.desc}</p>
                </div>

                <div className="plan-price">
                  <span className="price-val">
                    {isProjectMode ? plan.priceProject : plan.priceMonthly}
                  </span>
                  <span className="price-period">{isProjectMode ? ' total' : '/month'}</span>
                </div>

                <a href="mailto:hi@loc.digital" className={`plan-cta-btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  Start this plan
                </a>

                <div className="plan-features-header">Scope parameters:</div>
                <ul className="plan-features">
                  {plan.features.map((feat: string, idx: number) => (
                    <li key={idx}>
                      <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="faq-section toki-r" data-d="5">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-desc">Clear answers about collaboration processes, scope, and technical setups.</p>
          </div>

          <div className="faq-accordion-container">
            {faqs.map((faq, index) => {
              const expanded = !!expandedFaqs[index];
              return (
                <div className="faq-item" key={index}>
                  <button 
                    className={`faq-header ${expanded ? 'active' : ''}`}
                    aria-expanded={expanded ? "true" : "false"}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="faq-question-wrapper">
                      {faq.iconName === "calendar" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-question-icon">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      )}
                      {faq.iconName === "code" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-question-icon">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      )}
                      {faq.iconName === "zap" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-question-icon">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      )}
                      {faq.iconName === "message" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-question-icon">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                      <span className="faq-question">{faq.q}</span>
                    </span>
                    <svg className="faq-toggle-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 8h12" />
                      <path className="vertical-line" d="M8 2v12" style={{ display: expanded ? 'none' : 'block' }} />
                    </svg>
                  </button>
                  <div 
                    className="faq-answer-wrapper" 
                    id={`faq-answer-${index}`} 
                    aria-hidden={expanded ? "false" : "true"}
                    style={{ 
                      opacity: expanded ? 1 : 0, 
                      display: expanded ? 'block' : 'none',
                      transition: 'opacity 0.25s ease' 
                    }}
                  >
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="services-cta toki-r" data-d="6">
          <div className="cta-card">
            <h2 className="cta-title">Ready to clean up the growth system?</h2>
            <p className="cta-desc">
              Send the bottleneck, the target, and the current stack. I will map the shortest useful scope.
            </p>
            <div className="cta-buttons">
              <a href="mailto:hi@loc.digital" className="btn btn-primary">
                hi@loc.digital <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
