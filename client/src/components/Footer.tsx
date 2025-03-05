import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <a className="text-xl font-[Fredoka One]">
                <span className="text-primary">Story</span>
                <span className="text-secondary">Pals</span>
              </a>
            </Link>
            <span className="ml-4 text-sm text-gray-500">© {new Date().getFullYear()} All rights reserved</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              <i className="fab fa-pinterest"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
