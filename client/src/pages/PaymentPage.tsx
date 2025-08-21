import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard, Shield, Truck } from "lucide-react";

interface PaymentPageProps {
  orderId?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage(params: { orderId?: string }) {
  const orderId = params?.orderId;
  console.log("💳 PaymentPage loaded with params:", params, "orderId:", orderId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>("");

  useEffect(() => {
    console.log("💳 PaymentPage useEffect - orderId:", orderId);
    if (!orderId) {
      console.log("❌ No orderId provided, redirecting to home");
      setLocation("/");
      return;
    }

    const loadData = async () => {
      try {
        console.log("🔄 Loading order data and payment config...");
        // Load both order data and Razorpay config
        const [orderResponse, configResponse] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch("/api/payments/config")
        ]);

        console.log("📦 Order response:", orderResponse.status, orderResponse.ok);
        console.log("⚙️ Config response:", configResponse.status, configResponse.ok);

        if (!orderResponse.ok) throw new Error("Order not found");
        if (!configResponse.ok) throw new Error("Payment config not available");

        const order = await orderResponse.json();
        const config = await configResponse.json();
        
        console.log("✅ Order data loaded:", order);
        console.log("✅ Config loaded:", config);
        
        setOrderData(order);
        setRazorpayKeyId(config.keyId);
      } catch (error) {
        console.error("❌ Error loading payment page data:", error);
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

    loadData();
  }, [orderId, setLocation, toast]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!orderData || !user) return;

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await apiRequest("POST", "/api/payments/create-order", {
        orderId: orderData.id,
        amount: 2999, // $29.99 in paise (Indian currency subunit)
        currency: "INR",
      });

      const { razorpayOrderId, amount, currency } = orderResponse;

      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: "StoryPals",
        description: `Custom Story Book - ${orderData.bookTitle || "Personalized Story"}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiRequest("POST", "/api/payments/verify", {
              orderId: orderData.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              toast({
                title: "Payment Successful!",
                description: "Your order has been confirmed",
              });
              setLocation(`/order-success/${orderData.id}`);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        prefill: {
          name: `${orderData.firstName} ${orderData.lastName}`,
          email: user.email,
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error.description,
          variant: "destructive",
        });
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleBackToOrder = () => {
    setLocation(`/edit-pdf/${orderData.bookId}`);
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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToOrder}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Custom Story Book</span>
                <span className="font-bold">$29.99</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>$29.99</span>
              </div>
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
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by Razorpay</span>
            </div>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isProcessing ? "Processing..." : "Pay & Confirm Order"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your payment is secured with 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
}