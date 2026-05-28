import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import HeroSection from "@/components/hero";
import Link from "next/link";
import { MessageText1, Star1 } from "iconsax-react";
import { ArrowRightIcon } from "@/components/ui/arrow-right";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 surface-card p-8 md:p-10">
            <div
              aria-hidden
              className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full bg-[#89E900]/10 blur-3xl"
            />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
              {statsData.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-gradient-lime">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-[#89E900] mb-3">
              Features
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Everything you need to take{" "}
              <span className="text-white underline decoration-[#89E900] decoration-[6px] underline-offset-[6px]">
                control of your money
              </span>
            </h2>
            <p className="mt-4 text-gray-400">
              Designed for the Indian context — UPI-friendly, ₹ by default, and
              actually useful insights instead of generic charts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden surface-card hover:border-[#89E900]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  aria-hidden
                  className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#89E900]/15 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 blur-3xl"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#89E900]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <CardContent className="pt-6 space-y-3 relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#b6f047] via-[#89E900] to-[#7AD100] text-[#0a0a0a] shadow-lg shadow-[#89E900]/40">
                    <span className="icon-hover flex">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-[#89E900] mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Start tracking in{" "}
              <span className="text-white underline decoration-[#89E900] decoration-[6px] underline-offset-[6px]">
                three steps
              </span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              aria-hidden
              className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#89E900]/50 to-transparent"
            />
            {howItWorksData.map((step, index) => (
              <div
                key={index}
                className="relative text-center bg-[#161616] border border-white/10 rounded-2xl p-7"
              >
                <div className="relative mx-auto mb-5">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-[#89E900] text-[#0a0a0a] shadow-lg shadow-[#89E900]/30 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 right-[28%] sm:right-[34%] md:right-[32%] h-6 w-6 rounded-full bg-[#0a0a0a] border border-[#89E900] text-[10px] font-bold text-[#89E900] flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-[#89E900] mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Loved by users{" "}
              <span className="text-white underline decoration-[#89E900] decoration-[6px] underline-offset-[6px]">
                across India
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialsData.map((t, index) => (
              <Card
                key={index}
                className="relative overflow-hidden bg-[#161616] border-white/10 hover:border-[#89E900]/30 transition-colors"
              >
                <CardContent className="pt-6 space-y-4">
                  <MessageText1 className="h-7 w-7 text-[#89E900]" />
                  <p className="text-gray-300 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={44}
                      height={44}
                      className="rounded-full ring-2 ring-[#89E900]/40"
                    />
                    <div>
                      <div className="font-semibold leading-tight text-white">
                        {t.name}
                      </div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(5)].map((_, i) => (
                        <Star1
                          key={i}
                          className="h-3.5 w-3.5 fill-[#89E900] text-[#89E900]"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - lime panel bookend */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div
            className="relative overflow-hidden rounded-3xl panel-lime text-center text-[#0a0a0a] p-10 md:p-16"
            style={{ boxShadow: "0 30px 80px -20px rgba(137,233,0,0.5), 0 0 120px 0 rgba(137,233,0,0.25), 0 0 0 1px rgba(137,233,0,0.3)" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,10,10,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,10,10,0.08)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
            />
            <div
              aria-hidden
              className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#0a0a0a]/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
            />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]/70 mb-3">
                Ready when you are
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Take control of your finances today
              </h2>
              <p className="text-[#0a0a0a]/75 mb-8 max-w-2xl mx-auto">
                Join thousands of users in India who are already managing their
                money smarter with BudgetFLOW. Free to start, no card required.
              </p>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-[#0a0a0a] text-[#89E900] hover:bg-[#1a1a1a] shadow-lg shadow-black/40 font-semibold gap-2 px-8"
                >
                  Start free
                  <ArrowRightIcon size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
