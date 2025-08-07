import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import DecorativeElements from "@/components/DecorativeElements";
import StoryBookIllustration from "@/components/StoryBookIllustration";

const PROCESS_STEPS = [
  {
    icon: "👤",
    title: "Upload photo of your character",
    description: ""
  },
  {
    icon: "📝",
    title: "Write a general blurb",
    description: "(add characters or themes)"
  },
  {
    icon: "✨",
    title: "Let us work our magic!",
    description: ""
  }
];

export default function HomePage() {
  const [, navigate] = useLocation();

  const handleStartCreating = () => {
    navigate("/create");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow relative">
        {/* Decorative background elements */}
        <DecorativeElements />

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="imaginory-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="relative z-10">
                <div className="mb-6">
                  <h1 className="font-heading font-bold text-foreground mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl">
                    Create your own{" "}
                    <span className="playful-underline">customised</span>{" "}
                    storybook in under{" "}
                    <span className="bg-imaginory-yellow px-2 py-1 rounded-md inline-block transform -rotate-1">three</span>{" "}
                    minutes
                  </h1>
                  <p className="text-xl font-body text-muted-foreground mb-8 leading-relaxed">
                    Your child becomes the star of their own magical adventure! ✨
                  </p>
                </div>

                <Button 
                  className="imaginory-button text-lg px-10 py-5"
                  onClick={handleStartCreating}
                >
                  Start Your Story
                </Button>
              </div>

              {/* Right Column - Illustration */}
              <div className="relative z-10 flex justify-center lg:justify-end">
                <div className="imaginory-card max-w-md w-full aspect-square relative">
                  <StoryBookIllustration className="w-full h-full" />
                  {/* Decorative elements on the card */}
                  <div className="absolute top-4 right-4">
                    <div className="star"></div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="squiggle"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Simplified */}
        <section className="relative py-16 bg-white/50">
          <div className="imaginory-container">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-8">
                How It Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {PROCESS_STEPS.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-lg font-body text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16">
          <div className="imaginory-container text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">
                Ready to create magic? ✨
              </h2>
              <p className="text-xl font-body text-muted-foreground mb-8">
                Join thousands of families who've created unforgettable stories with their children!
              </p>
              <Button 
                className="imaginory-button text-xl px-12 py-6"
                onClick={handleStartCreating}
              >
                Start Creating Your Story
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
