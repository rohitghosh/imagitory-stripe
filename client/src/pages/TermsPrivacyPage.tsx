import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, FileText, Mail, Clock } from "lucide-react";

export default function TermsPrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-center mb-2">
            Terms & Privacy Policy
          </h1>
          <p className="text-gray-600 text-center">
            Effective Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Terms of Service */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">
                1. Service Overview
              </h3>
              <p className="text-gray-700 leading-relaxed">
                StoryPals provides personalized children's book creation and
                printing services. By using our platform, you agree to create
                custom story books featuring your child as the main character,
                delivered as high-quality printed books to your specified
                address.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                2. Order Process & Payment
              </h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>
                  • Orders are processed immediately upon payment confirmation
                </li>
                <li>
                  • First-time users may receive complimentary story generation
                </li>
                <li>
                  • Payment is required before story generation for returning
                  users
                </li>
                <li>• All payments are processed securely through Razorpay</li>
                <li>
                  • Prices include all applicable taxes and free shipping within
                  India
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                3. Shipping & Delivery
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">📦 Shipping Timeline</h4>
                <ul className="text-gray-700 space-y-1 ml-4">
                  <li>
                    • Standard delivery: 3-5 business days from order
                    confirmation
                  </li>
                  <li>
                    • Processing time: 1-2 business days for book printing
                  </li>
                  <li>• Tracking information provided via email</li>
                  <li>
                    • Delivery attempts: Up to 3 attempts by courier partner
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                4. Cancellations & Refunds
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-green-700">
                    ✅ Eligible for Refund
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Cancellation within 2 hours of order</li>
                    <li>• Shipment delayed beyond 7 business days</li>
                    <li>• Book arrives in damaged condition</li>
                    <li>• Printing quality issues</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-red-700">
                    ❌ Refund Conditions
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• ₹200 processing fee for early cancellations</li>
                    <li>• Custom content cannot be refunded after printing</li>
                    <li>
                      • Address changes after shipping incur additional costs
                    </li>
                    <li>• Refunds processed to original payment method only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                5. Content Guidelines
              </h3>
              <p className="text-gray-700 leading-relaxed">
                All user-generated content must be appropriate for children and
                comply with our community standards. We reserve the right to
                refuse processing of content that violates copyright, contains
                inappropriate material, or violates applicable laws.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                6. Limitation of Liability
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our liability is limited to the purchase price of your order. We
                are not responsible for indirect, consequential, or punitive
                damages. Service availability and delivery times may vary due to
                circumstances beyond our control.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">
                1. Information We Collect
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">📋 Personal Information</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Name and email address</li>
                    <li>• Shipping address and phone number</li>
                    <li>• Payment information (processed securely)</li>
                    <li>• Child's name, age, and preferences</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🔄 Usage Information</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Story creation preferences</li>
                    <li>• Platform usage patterns</li>
                    <li>• Device and browser information</li>
                    <li>• Order history and interactions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                2. How We Use Your Information
              </h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>
                  • <strong>Service Delivery:</strong> Create and ship
                  personalized books
                </li>
                <li>
                  • <strong>Communication:</strong> Order updates, shipping
                  notifications, support
                </li>
                <li>
                  • <strong>Payment Processing:</strong> Secure transaction
                  handling
                </li>
                <li>
                  • <strong>Service Improvement:</strong> Enhance user
                  experience and story quality
                </li>
                <li>
                  • <strong>Legal Compliance:</strong> Meet regulatory and
                  business requirements
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">3. Data Security</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="text-gray-700 space-y-2">
                  <li>
                    • <strong>Encryption:</strong> 256-bit SSL encryption for
                    all data transmission
                  </li>
                  <li>
                    • <strong>Payment Security:</strong> PCI DSS compliant
                    payment processing
                  </li>
                  <li>
                    • <strong>Data Storage:</strong> Secure cloud storage with
                    regular backups
                  </li>
                  <li>
                    • <strong>Access Control:</strong> Limited access to
                    authorized personnel only
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">4. Data Sharing</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell your personal information. We may share data
                with:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>
                  • <strong>Service Providers:</strong> Printing, shipping, and
                  payment partners
                </li>
                <li>
                  • <strong>Legal Requirements:</strong> When required by law or
                  legal process
                </li>
                <li>
                  • <strong>Business Transfers:</strong> In case of merger,
                  acquisition, or asset sale
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">5. Your Rights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">👤 Data Rights</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Access your personal data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete your account and data</li>
                    <li>• Export your data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📧 Contact for Rights</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Email: privacy@storypals.com</li>
                    <li>• Response time: 5 business days</li>
                    <li>• Identity verification required</li>
                    <li>• Free exercise of rights</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                6. Children's Privacy
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We are committed to protecting children's privacy. We only
                collect information necessary for story creation with parental
                consent. Children's images and personal information are used
                solely for book personalization and are not shared with third
                parties except as required for service delivery.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">
                7. Cookies & Analytics
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We use essential cookies for platform functionality and
                analytics cookies to improve user experience. You can manage
                cookie preferences in your browser settings. Some features may
                not work properly if cookies are disabled.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">Email Support</h4>
                <p className="text-sm text-gray-600">hello@imagitory.in</p>
                <p className="text-xs text-gray-500">
                  Response within 24 hours
                </p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium">Privacy Inquiries</h4>
                <p className="text-sm text-gray-600">hello@imagitory.in</p>
                <p className="text-xs text-gray-500">Data protection officer</p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium">Business Hours</h4>
                <p className="text-sm text-gray-600">
                  Mon-Fri: 9 AM - 6 PM IST
                </p>
                <p className="text-xs text-gray-500">Excluding holidays</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 text-center">
              This policy may be updated periodically. Continued use of our
              service constitutes acceptance of any changes. Major changes will
              be communicated via email to registered users.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Last updated: {new Date().toLocaleDateString()} | Version 1.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
