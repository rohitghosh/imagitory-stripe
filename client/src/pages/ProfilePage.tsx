import { useState } from "react";
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

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("characters");

  // Query for custom characters only
  const { data: customCharacters = [], isLoading: loadingCustomCharacters } =
    useQuery({
      queryKey: ["/api/characters", "custom", user?.uid],
      queryFn: async () => {
        const response = await fetch(
          "/api/characters?type=custom&userId=" + user?.uid,
        );
        return response.json();
      },
      enabled: !!user,
    }) as { data: Character[]; isLoading: boolean };

  // Query for custom stories only
  const { data: customStories = [], isLoading: loadingCustomStories } =
    useQuery({
      queryKey: ["/api/stories", "custom", user?.uid],
      queryFn: async () => {
        const response = await fetch(
          "/api/stories?type=custom&userId=" + user?.uid,
        );
        return response.json();
      },
      enabled: !!user,
    }) as { data: Story[]; isLoading: boolean };

  // Query for books (generated books)
  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["/api/books", user?.uid],
    queryFn: async () => {
      const response = await fetch("/api/books?userId=" + user?.uid);
      return response.json();
    },
    enabled: !!user,
  }) as { data: Book[]; isLoading: boolean };

  // Query for orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/orders", user?.uid],
    queryFn: async () => {
      const response = await fetch("/api/orders?userId=" + user?.uid);
      return response.json();
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
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Changed grid-cols-3 to grid-cols-4 */}
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="characters">My Custom Characters</TabsTrigger>
              <TabsTrigger value="stories">My Custom Story Line</TabsTrigger>
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
                  {customCharacters.map((character) => (
                    <Card key={character.id} className="overflow-hidden">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={
                            character.imageUrls &&
                            character.imageUrls.length > 0
                              ? character.imageUrls[0]
                              : "https://via.placeholder.com/300"
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

            {/* Custom Stories Tab */}
            <TabsContent value="stories">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">My Custom Story Line</h3>
                <Link href="/create">
                  <Button>Create New Story</Button>
                </Link>
              </div>
              {loadingCustomStories ? (
                <div className="text-center py-12">Loading stories...</div>
              ) : customStories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    You haven't created any custom story lines yet.
                  </p>
                  <Link href="/create">
                    <Button>Create Your First Story</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customStories.map((story) => (
                    <Card key={story.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-lg mb-1">
                          {story.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(story.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2 mt-4">
                          <Link href={`/story/${story.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/story/${story.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <Card key={book.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-lg mb-1">
                          {book.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(book.createdAt).toLocaleDateString()}
                        </p>
                        {book.imageUrls && book.imageUrls.length > 0 && (
                          <img
                            src={book.imageUrls[0]}
                            alt={book.title}
                            className="w-full h-40 object-cover my-2 rounded"
                          />
                        )}
                        <Link href={`/book/${book.id}`}>
                          <Button variant="outline" size="sm">
                            View Book
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">My Orders</h3>
              </div>
              {loadingOrders ? (
                <div className="text-center py-12">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    You haven't placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {orders.map((order) => (
                    <div key={order.id} className="py-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">
                            Order #{order.id}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-1">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <p className="text-gray-600">
                            Ship to: {order.firstName} {order.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.address}, {order.city}, {order.state}{" "}
                            {order.zip}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
