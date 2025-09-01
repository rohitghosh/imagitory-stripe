import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Character, Story, Order, Book } from "@shared/schema";
import { useQueryParam } from "@/hooks/useQueryParam";

export default function ProfilePage() {
  console.log("ProfilePage rendered");

  const { user } = useAuth();
  const tabFromUrl = useQueryParam("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "characters");
  // const [location] = useLocation();

  console.log("🔍 window.location.search:", window.location.search);
  console.log("🔍 tabFromUrl from hook:", tabFromUrl);
  console.log("🔍 current activeTab state:", activeTab);

  // Update activeTab based on URL query parameter
  useEffect(() => {
    console.log("📦 useEffect triggered: tabFromUrl =", tabFromUrl);
    if (tabFromUrl && tabFromUrl !== activeTab) {
      console.log("➡️ Updating activeTab to", tabFromUrl);
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const {
    data: predefinedCharacters = [],
    isLoading: loadingPredefinedCharacters,
  } = useQuery({
    queryKey: ["/api/characters", "predefined"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/characters?type=predefined", {
          credentials: "include",
        });
        if (!response.ok) {
          console.error(
            "Failed to fetch predefined characters:",
            response.statusText,
          );
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching predefined characters:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Query for custom characters only
  const { data: customCharacters = [], isLoading: loadingCustomCharacters } =
    useQuery({
      queryKey: ["/api/characters", "custom", user?.uid],
      queryFn: async () => {
        try {
          const response = await fetch(
            "/api/characters?type=custom&userId=" + user?.uid,
            { credentials: "include" },
          );
          console.log("Characters API response:", response);
          if (!response.ok) {
            console.error("Failed to fetch characters:", response.statusText);
            return [];
          }
          const data = await response.json();
          console.log("Characters data received:", data);
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error("Error fetching characters:", error);
          return [];
        }
      },
      enabled: !!user,
    }) as { data: Character[]; isLoading: boolean };

  const allCharacters = [...customCharacters, ...predefinedCharacters];

  // Query for books (generated books)
  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["/api/books", user?.uid],
    queryFn: async () => {
      try {
        const response = await fetch("/api/books?userId=" + user?.uid, {
          credentials: "include",
        });
        console.log("Books API response:", response);
        if (!response.ok) {
          console.error("Failed to fetch books:", response.statusText);
          return [];
        }
        const data = await response.json();
        console.log("Books data received:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching books:", error);
        return [];
      }
    },
    enabled: !!user,
  }) as { data: Book[]; isLoading: boolean };

  // Query for orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/orders", user?.uid],
    queryFn: async () => {
      try {
        const response = await fetch("/api/orders?userId=" + user?.uid, {
          credentials: "include",
        });
        console.log("Orders API response:", response);
        if (!response.ok) {
          console.error("Failed to fetch orders:", response.statusText);
          return [];
        }
        const data = await response.json();
        console.log("Orders data received:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
    enabled: !!user,
  }) as { data: Order[]; isLoading: boolean };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">My Profile</h1>
            <div className="flex items-center space-x-4 mb-6">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              console.log("🖱️ Tab changed by user to:", val);
              setActiveTab(val);
              const url = new URL(window.location.href);
              url.searchParams.set("tab", val);
              window.history.replaceState({}, "", url.toString());
            }}
            className="w-full"
          >
            {/* Changed grid-cols-3 to grid-cols-4 */}
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="characters">My Custom Characters</TabsTrigger>
              <TabsTrigger value="books">My Books</TabsTrigger>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
            </TabsList>

            {/* Custom Characters Tab */}
            <TabsContent value="characters">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">My Custom Characters</h3>
                <Link href="/create">
                  <Button>Create New Character</Button>
                </Link>
              </div>
              {loadingCustomCharacters ? (
                <div className="text-center py-12">Loading characters...</div>
              ) : customCharacters.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    You haven't created any custom characters yet.
                  </p>
                  <Link href="/create">
                    <Button>Create Your First Character</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customCharacters
                    .slice()
                    .filter((c) => c.name !== "__DRAFT__")
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((character) => (
                      <Card key={character.id} className="overflow-hidden">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={
                              character.imageUrls &&
                              character.imageUrls.length > 0 &&
                              character.toonUrl
                                ? character.toonUrl
                                : character.imageUrls[0]
                            }
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-lg mb-1">
                            {character.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            {character.gender}, {character.age} years old
                          </p>
                          <Link href={`/create?character=${character.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Create Story with {character.name}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">My Books</h3>
                <Link href="/create">
                  <Button>Create New Book</Button>
                </Link>
              </div>
              {loadingBooks ? (
                <div className="text-center py-12">Loading books...</div>
              ) : books.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    You haven't created any books yet.
                  </p>
                  <Link href="/create">
                    <Button>Create Your First Book</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cover
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Character
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {books
                        .slice() // create a shallow copy
                        .filter(
                          (book) => book.title && book.title.trim() !== "",
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((book) => (
                          <tr key={book.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {book.cover.final_cover_urls ? (
                                <img
                                  src={book.cover.final_cover_urls[0]}
                                  alt={book.title}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <span>No Cover</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {book.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {
                                // Look up character name from the combined array.
                                allCharacters.find(
                                  (c) => c.id === book.characterId,
                                )?.name ||
                                  book.characterId ||
                                  "N/A"
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link href={`/edit-pdf/${book.id}`}>
                                <Button variant="outline" size="sm">
                                  View Book
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">My Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placed On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipping Address
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders
                      .slice() // make a copy
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(), // newest first
                      )
                      .map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.bookTitle ??
                              books.find((b) => b.id === order.bookId)?.title ??
                              "Untitled Book"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.address}, {order.city}, {order.state} {order.zip}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
