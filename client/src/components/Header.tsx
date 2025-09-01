import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import imagitoryLogo from "/src/assets/imagitory-logo.png";

export function Header() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine if we should show the Create Story button and what text to use
  const shouldShowCreateButton = location === "/" || location.startsWith("/edit-pdf");
  const isEditPdfPage = location.startsWith("/edit-pdf");
  const createButtonText = isEditPdfPage ? "Create Another Story" : "Create Story";

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="bg-white rounded-lg p-2 cursor-pointer transform hover:scale-105 transition-transform">
              <img
                src={imagitoryLogo}
                alt="imagitory"
                className="h-12 sm:h-14 md:h-16 w-auto
                object-contain
                selec-none"
              />
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-4">
          {/* <Link href="/">
            <Button 
              variant="ghost" 
              className="font-sans text-imaginory-black hover:bg-gray-100 rounded-2xl px-4 py-2 transition-all"
            >
              Home
            </Button>
          </Link> */}
          {shouldShowCreateButton && (
            <Link href="/create">
              <Button className="imaginory-button px-2.5 py-1 text-[10px] leading-none hover:scale-100 sm:px-8 sm:py-4 sm:text-lg sm:hover:scale-105">
                {createButtonText}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer border-2 border-gray-300 hover:border-imaginory-yellow transition-colors">
                  {user.photoURL ? (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gray-100 text-imaginory-black font-bold">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border border-gray-200 rounded-2xl shadow-xl"
              >
                <DropdownMenuLabel className="font-body">
                  <div className="font-normal text-muted-foreground">
                    Signed in as
                  </div>
                  <div className="font-bold text-imaginory-black truncate">
                    {user.displayName || user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuGroup>
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer font-body hover:bg-gray-100 rounded-xl">
                      <span>My Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile?tab=characters">
                    <DropdownMenuItem className="cursor-pointer font-body hover:bg-gray-100 rounded-xl">
                      <span>My Custom Characters</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile?tab=books">
                    <DropdownMenuItem className="cursor-pointer font-body hover:bg-gray-100 rounded-xl">
                      <span>My Books</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile?tab=orders">
                    <DropdownMenuItem className="cursor-pointer font-body hover:bg-gray-100 rounded-xl">
                      <span>My Orders</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem
                  className="cursor-pointer font-body hover:bg-gray-100 rounded-xl"
                  onClick={handleSignOut}
                >
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                className="font-body border-2 border-gray-300 text-imaginory-black hover:bg-gray-100 rounded-2xl px-2 py-1.5 text-xs hover:scale-100 sm:px-6 sm:text-base sm:hover:scale-105 transition-all"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
