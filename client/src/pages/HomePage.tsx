import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import DecorativeElements from "@/components/DecorativeElements";

const PROCESS_STEPS = [
  {
    image: "/step-1.png",
    title: "Upload photos of your characters",
    description: "",
  },
  {
    image: "/step-2.png",
    title: "Write a general blurb of your story",
    description: "(include any storyline or characters)",
  },
  {
    image: "/step-3.png",
    title: "Let us work our magic!",
    description: "",
  },
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
                    <span className="bg-imaginory-yellow px-2 py-1 rounded-md inline-block transform -rotate-1">
                      three
                    </span>{" "}
                    minutes
                  </h1>
                  <p className="text-xl font-body text-muted-foreground mb-8 leading-relaxed">
                    Your child becomes the star of their own magical adventure!
                    ✨
                  </p>
                </div>

                <Button
                  className="imaginory-button text-lg px-10 py-5"
                  onClick={handleStartCreating}
                >
                  Start Your Story
                </Button>
              </div>

              {/* Right Column - New Asset Image */}
              <div className="relative z-10 flex justify-center lg:justify-end">
                <img
                  src="/storybook-illustration.png"
                  alt="Children reading a magical storybook"
                  className="w-full max-w-lg h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Screenshot Style */}
        <section className="relative py-16 bg-white/50">
          <div className="imaginory-container">
            <div className="text-center mb-16">
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
                How It Works
              </h2>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-start space-y-12 md:space-y-0 md:space-x-4 lg:space-x-8 max-w-5xl mx-auto">
              {PROCESS_STEPS.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center text-center flex-1 w-full"
                >
                  <div className="mb-8">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain"
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-heading font-bold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-sm md:text-base font-body text-muted-foreground">
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
                Join thousands of families who've created unforgettable stories
                with their children!
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
