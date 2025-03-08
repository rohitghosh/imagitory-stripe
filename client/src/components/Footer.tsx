import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">StoryPals</h3>
            <p className="text-gray-600 text-sm">
              Creating personalized children's stories with your child as the main character.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-gray-600 hover:text-primary">
                  Create a Story
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-primary">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: support@storypals.com</li>
              <li>Phone: (123) 456-7890</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} StoryPals. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}