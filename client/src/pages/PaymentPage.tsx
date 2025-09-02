import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
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

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId;
  console.log("💳 PaymentPage loaded with useParams:", params, "orderId:", orderId);
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
        amount: 100, // $29.99 in paise (Indian currency subunit)
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
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToOrder}
              className="mb-4 text-imaginory-black hover:text-imaginory-yellow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order
            </Button>
          </div>

          <Card className="mb-6 border border-imaginory-yellow/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-imaginory-black font-heading">
                <CreditCard className="w-5 h-5 text-imaginory-yellow" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium font-body text-imaginory-black">Custom Story Book</span>
                  <span className="font-bold font-heading text-imaginory-black">₹1.00</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground font-body">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <hr className="border-imaginory-yellow/30" />
                <div className="flex justify-between text-lg font-bold font-heading text-imaginory-black">
                  <span>Total</span>
                  <span>₹1.00</span>
                </div>
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
                <p className="font-medium font-body text-imaginory-black">{orderData.firstName} {orderData.lastName}</p>
                <p className="text-sm text-muted-foreground font-body">{orderData.address}</p>
                <p className="text-sm text-muted-foreground font-body">
                  {orderData.city}, {orderData.state} {orderData.zip}
                </p>
                <p className="text-sm text-muted-foreground font-body">{orderData.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border border-imaginory-yellow/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 font-body">
                <Shield className="w-4 h-4 text-imaginory-yellow" />
                <span>Secure payment powered by Razorpay</span>
              </div>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="imaginory-button w-full py-3 px-8 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {isProcessing ? "Processing..." : "Pay & Confirm Order"}
              </Button>
            </CardContent>
          </Card>

          {/* Policies Section */}
          <Card className="mb-6 border border-imaginory-yellow/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-imaginory-black font-heading">
                <Shield className="w-5 h-5 text-imaginory-yellow" />
                Shipping & Policies
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-700">📦 Shipping Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Standard delivery: 3-5 business days</li>
                  <li>• Free shipping on all orders</li>
                  <li>• Tracking details provided via email</li>
                  <li>• Secure packaging for book protection</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-700">💰 Refund Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cancellations: Within 2 hours (₹200 processing fee)</li>
                  <li>• Delayed shipments: Partial refund available</li>
                  <li>• Damaged items: Replacement or refund</li>
                  <li>• Refunds processed within 5-7 business days</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-700">📞 Contact & Support</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Email support: help@storypals.com</li>
                  <li>• Response time: Within 24 hours</li>
                  <li>• Order tracking assistance available</li>
                  <li>• Quality assurance guarantee</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-700">🔄 Cancellations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cancel within 2 hours: Minimal processing fee</li>
                  <li>• After printing: Only if delayed shipment</li>
                  <li>• Contact support for assistance</li>
                  <li>• Refunds via original payment method</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-imaginory-yellow/30 pt-4 mt-6">
              <p className="text-xs text-gray-500 text-center font-body">
                By placing this order, you agree to our{" "}
                <button 
                  onClick={() => setLocation("/terms-privacy")}
                  className="text-imaginory-yellow hover:text-imaginory-black hover:underline font-medium transition-colors"
                >
                  Terms & Conditions and Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

          <div className="text-center text-sm text-muted-foreground font-body">
            <p>Your payment is secured with 256-bit SSL encryption</p>
          </div>
        </div>
      </main>
    </div>
  );
}