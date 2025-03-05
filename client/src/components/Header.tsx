import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <span className="text-3xl font-bold cursor-pointer">
              <span className="text-primary">Story</span>
              <span className="text-blue-400">Pals</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/create">
            <Button>Create Story</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
