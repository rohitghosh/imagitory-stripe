import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, Truck, Home, BookOpen } from "lucide-react";

interface OrderSuccessPageProps {
  orderId?: string;
}

export default function OrderSuccessPage(params: { orderId?: string }) {
  const orderId = params?.orderId;
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your custom story book is being prepared.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order ID</span>
                <span className="text-sm text-muted-foreground font-mono">#{orderData.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <Badge className={getStatusColor(orderData.status || "paid")}>
                  {getStatusIcon(orderData.status || "paid")}
                  <span className="ml-1 capitalize">{orderData.status || "Paid"}</span>
                </Badge>
              </div>
              {bookData && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Book Title</span>
                  <span className="text-right max-w-xs truncate">{bookData.title}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount Paid</span>
                <span className="font-bold">$29.99</span>
              </div>
              {orderData.razorpayPaymentId && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment ID</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {orderData.razorpayPaymentId.slice(-10)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{orderData.firstName} {orderData.lastName}</p>
              <p className="text-sm text-muted-foreground">{orderData.address}</p>
              <p className="text-sm text-muted-foreground">
                {orderData.city}, {orderData.state} {orderData.zip}
              </p>
              <p className="text-sm text-muted-foreground">{orderData.country}</p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📦 Your book will be printed and shipped within 3-5 business days.
                You'll receive a tracking number via email once it ships.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button
            onClick={() => setLocation("/profile")}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            View My Books
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Need help? Contact us at support@storypals.com</p>
        </div>
      </div>
    </div>
  );
}