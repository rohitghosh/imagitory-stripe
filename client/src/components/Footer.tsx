import { Link } from "wouter";
import imagitoryLogo from "../assets/imagitory-logo.png";

export function Footer() {
  return (
    <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200 py-12">
      <div className="imaginory-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img 
              src={imagitoryLogo} 
              alt="imagitory" 
              className="h-12 w-auto mb-4 bg-white rounded-lg p-1"
            />
            <p className="text-muted-foreground font-body leading-relaxed">
              Creating personalized children's stories with your child as the
              main character. Every story is a magical adventure waiting to
              happen! 🌟
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold mb-4 text-imaginory-black">
              Quick Links
            </h3>
            <ul className="space-y-3 font-body">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-imaginory-black transition-colors"
                >
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="text-muted-foreground hover:text-imaginory-black transition-colors"
                >
                  ✨ Create a Story
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-muted-foreground hover:text-imaginory-black transition-colors"
                >
                  👤 My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold mb-4 text-imaginory-black">
              Contact
            </h3>
            <ul className="space-y-3 font-body text-muted-foreground">
              {/* <li className="flex items-center">
                <span className="mr-2">📧</span>
                support@imaginory.com
              </li> */}
              <li className="flex items-center">
                <span className="mr-2">💌</span>
                We'd love to hear from you!
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-muted-foreground font-body">
            © {new Date().getFullYear()} Imaginory. All rights reserved.
            <span className="ml-2">Made with ❤️ for families everywhere</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
