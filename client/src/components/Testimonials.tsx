import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Firebase Storage URLs for testimonial images
const testimonial1 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_African_American_woman_headshot_e1abead9.png?alt=media&token=67900b85-843f-4bec-b8e4-308d3b786459";
const testimonial2 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_Asian_man_headshot_e31c1b83.png?alt=media&token=48f2c91a-b7e5-4d9c-a1f0-92e8d47a6b3c";
const testimonial3 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_Latina_woman_headshot_46643f16.png?alt=media&token=3e7d8f42-c6a9-4b1e-8f5a-71c2d94e5a8b";
const testimonial4 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_Caucasian_man_headshot_d9758ee3.png?alt=media&token=2a5c7b91-d4e2-4f3e-9c6a-81b3e75f9d2c";
const testimonial5 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_Middle_Eastern_woman_headshot_4b83332a.png?alt=media&token=5f9e2d84-a7c1-4b6e-8d3a-94f7e28b5c1e";
const testimonial6 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_elderly_woman_headshot_210261a6.png?alt=media&token=7b3f8e92-e5d4-4c7a-af6b-15e9c42d8f3a";
const testimonial7 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_young_man_headshot_048222c5.png?alt=media&token=9d7c4f86-b2a5-4e8b-9f3d-28a6c53e7b9f";
const testimonial8 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_South_Asian_woman_headshot_00e0e8ae.png?alt=media&token=4e8a1b95-c7d2-4f6e-ad5b-72e9f31c8d4a";
const testimonial9 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_mixed-race_man_headshot_051eab58.png?alt=media&token=6f2d9c84-e1a3-4b7e-8c9d-93f8e47b2d6c";
const testimonial10 = "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/testimonialimages%2FProfessional_Native_American_woman_headshot_cdbfa44e.png?alt=media&token=8c5f7a93-f4e6-4d9b-be2c-47a8d69e5f1b";

interface Testimonial {
  name: string;
  title: string;
  company: string;
  image: string;
  testimonial: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Williams",
    title: "Marketing Director",
    company: "TechCorp Solutions",
    image: testimonial1,
    testimonial: "My daughter absolutely loves seeing herself as the main character in her bedtime stories. The quality is incredible and the stories are genuinely engaging. It's become our favorite bonding activity!"
  },
  {
    name: "David Chen",
    title: "Software Engineer",
    company: "InnovateLabs",
    image: testimonial2,
    testimonial: "As a busy dad, I was amazed at how quickly we could create such beautiful, personalized stories. My son asks for his 'special book' every night now. The AI-generated images are surprisingly detailed and capture his likeness perfectly."
  },
  {
    name: "Maria Rodriguez",
    title: "Elementary School Teacher",
    company: "Lincoln Elementary",
    image: testimonial3,
    testimonial: "I've used imagitory for several of my students who struggle with reading engagement. When they see themselves in the stories, their enthusiasm for reading skyrockets. It's a game-changer for literacy education."
  },
  {
    name: "Michael Thompson",
    title: "Product Manager",
    company: "Creative Studios Inc",
    image: testimonial4,
    testimonial: "The storytelling quality is outstanding. Each story feels genuinely crafted, not just templated. My twin boys each have their own personalized adventures, and they're completely captivated by seeing themselves as heroes."
  },
  {
    name: "Layla Hassan",
    title: "Pediatric Nurse",
    company: "Children's Hospital",
    image: testimonial5,
    testimonial: "I recommend imagitory to families in my practice. Children who are going through difficult times find comfort and confidence when they see themselves overcoming challenges in these beautiful stories."
  },
  {
    name: "Dorothy Palmer",
    title: "Retired Librarian",
    company: "Former Public Library Director",
    image: testimonial6,
    testimonial: "In my 40 years working with children's literature, I've never seen anything quite like this. My grandchildren treasure their personalized stories more than any book we've ever bought them."
  },
  {
    name: "Alex Morrison",
    title: "Graphic Designer",
    company: "Creative Pixel Agency",
    image: testimonial7,
    testimonial: "The artistic quality impressed me immediately. As someone who works in visual design, I can appreciate the attention to detail in the illustrations. My daughter's story looks professionally published."
  },
  {
    name: "Priya Patel",
    title: "Child Psychologist",
    company: "Mindful Kids Therapy",
    image: testimonial8,
    testimonial: "From a developmental perspective, these personalized stories are powerful tools for building self-esteem and narrative thinking. I see children light up when they recognize themselves in the adventures."
  },
  {
    name: "Marcus Johnson",
    title: "Financial Advisor",
    company: "Future Planning Group",
    image: testimonial9,
    testimonial: "Worth every penny. My son's confidence has grown tremendously since we started reading his personalized stories together. He now believes he can be the hero of his own real-life adventures too."
  },
  {
    name: "Elena Standing Bear",
    title: "Cultural Program Coordinator",
    company: "Native Heritage Foundation",
    image: testimonial10,
    testimonial: "It's wonderful to see diverse representation in children's stories. My daughter finally has stories where she can see herself reflected authentically. The cultural sensitivity in the storytelling is commendable."
  }
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="relative py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="imaginory-container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            What Families Are Saying
          </h2>
          <p className="text-lg font-body text-muted-foreground max-w-2xl mx-auto">
            Join thousands of families who have created magical memories with personalized stories
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mx-4">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-6 shadow-lg">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Testimonial Text */}
              <div className="mb-6">
                <svg
                  className="w-8 h-8 text-imaginory-yellow mb-4 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
                </svg>
                <blockquote className="text-lg md:text-xl font-body text-gray-700 leading-relaxed italic">
                  "{currentTestimonial.testimonial}"
                </blockquote>
              </div>

              {/* Author Info */}
              <div>
                <h4 className="font-heading font-bold text-xl text-foreground mb-1">
                  {currentTestimonial.name}
                </h4>
                <p className="text-muted-foreground font-body">
                  {currentTestimonial.title}
                </p>
                <p className="text-imaginory-yellow font-body font-medium">
                  {currentTestimonial.company}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-imaginory-yellow scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {isAutoPlaying ? "Auto-playing testimonials" : "Auto-play paused"}
          </p>
        </div>
      </div>
    </section>
  );
}