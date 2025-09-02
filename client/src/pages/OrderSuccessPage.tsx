import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, Truck, Home, BookOpen } from "lucide-react";

interface OrderSuccessPageProps {
  orderId?: string;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.orderId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [bookData, setBookData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLocation("/");
      return;
    }

    const loadOrderData = async () => {
      try {
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (!orderResponse.ok) throw new Error("Order not found");
        const order = await orderResponse.json();
        setOrderData(order);

        // Load book data
        const bookResponse = await fetch(`/api/books/${order.bookId}`);
        if (bookResponse.ok) {
          const book = await bookResponse.json();
          setBookData(book);
        }

        // If this is a story generation order, redirect to story creation page
        if (order.bookId) {
          toast({
            title: "Payment successful!",
            description: "Redirecting to story generation...",
          });
          setTimeout(() => {
            setLocation(`/create/${order.bookId}?payment_completed=true`);
          }, 2000);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load order details",
          variant: "destructive",
        });
        setLocation("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, setLocation, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "completed":
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imaginory-yellow"></div>
          <p className="text-muted-foreground font-body">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md border border-imaginory-yellow/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground font-body">Order not found</p>
            <Button 
              onClick={() => setLocation("/")} 
              className="imaginory-button mt-4"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="py-8">
        <div className="imaginory-container max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-imaginory-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-imaginory-yellow" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-imaginory-black mb-2">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground font-body">
              Thank you for your purchase. Your custom story book is being
              prepared.
            </p>
          </div>

          <Card className="mb-6 border border-imaginory-yellow/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-imaginory-black font-heading">
                <Package className="w-5 h-5 text-imaginory-yellow" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium font-body text-imaginory-black">Order ID</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    #{orderData.id.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium font-body text-imaginory-black">Status</span>
                  <Badge className={getStatusColor(orderData.status || "paid")}>
                    {getStatusIcon(orderData.status || "paid")}
                    <span className="ml-1 capitalize">
                      {orderData.status || "Paid"}
                    </span>
                  </Badge>
                </div>
                {bookData && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium font-body text-imaginory-black">Book Title</span>
                    <span className="text-right max-w-xs truncate font-body">
                      {bookData.title}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium font-body text-imaginory-black">Amount Paid</span>
                  <span className="font-bold font-body text-imaginory-black">$29.99</span>
                </div>
                {orderData.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium font-body text-imaginory-black">Payment ID</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {orderData.razorpayPaymentId.slice(-10)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border border-imaginory-yellow/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-imaginory-black font-heading">
                <Truck className="w-5 h-5 text-imaginory-yellow" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium font-body text-imaginory-black">
                  {orderData.firstName} {orderData.lastName}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {orderData.address}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {orderData.city}, {orderData.state} {orderData.zip}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {orderData.country}
                </p>
              </div>
              <div className="mt-4 p-3 bg-imaginory-yellow/10 border border-imaginory-yellow/30 rounded-lg">
                <p className="text-sm text-imaginory-black font-body">
                  📦 Your book will be printed and shipped within 3-5 business
                  days. You'll receive a tracking number via email once it ships.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="imaginory-button-secondary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
            <Button
              onClick={() => setLocation("/profile")}
              className="imaginory-button flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              View My Books
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground font-body">
            <p>Need help? Contact us at support@storypals.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
