import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const PROCESS_STEPS = [
  {
    icon: "fas fa-child",
    title: "Choose a Character",
    description: "Pick from our collection or create your own custom character."
  },
  {
    icon: "fas fa-book-open",
    title: "Select a Story",
    description: "Browse our story library or create a custom adventure."
  },
  {
    icon: "fas fa-download",
    title: "Preview & Download",
    description: "Review your story, make edits, and get your book!"
  }
];

export default function HomePage() {
  const [, navigate] = useLocation();

  const handleStartCreating = () => {
    navigate("/create");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              Create Custom Stories About Your Kids
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Turn your child into the hero of their own magical adventure in just three simple steps!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {PROCESS_STEPS.map((step, index) => (
              <div key={index} className="bg-white rounded-xl shadow-card p-6 text-center hover:shadow-card-hover transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${step.icon} text-2xl text-primary`}></i>
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={handleStartCreating}
            >
              Start Creating Your Story
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
