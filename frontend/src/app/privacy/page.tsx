import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BookWorm Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: March 2024</p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as when you create an account, submit book reviews, or contact us for support. This may include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Name and email address</li>
              <li>Profile information (avatar, bio)</li>
              <li>Book ratings and reviews</li>
              <li>Reading preferences and history</li>
              <li>Communications with us</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience and provide recommendations</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>With your consent</li>
              <li>With service providers who assist in operating our platform</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and the safety of users</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage practices</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">5. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to collect and track information and to improve our services. You can instruct your browser to refuse all cookies.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">7. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Our platform may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              BookWorm is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at privacy@bookworm.app.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
