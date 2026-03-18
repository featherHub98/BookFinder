import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BookWorm Terms of Service',
};

export default function TermsPage() {
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
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: March 2024</p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using BookWorm, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">2. Use License</h2>
            <p className="text-muted-foreground">
              Permission is granted to temporarily use BookWorm for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for safeguarding the password that you use to access BookWorm and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">4. User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of any content you submit, post, or display on or through BookWorm. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">5. Prohibited Activities</h2>
            <p className="text-muted-foreground">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Posting spam, misleading, or harmful content</li>
              <li>Impersonating another user or person</li>
              <li>Violating any local, state, national, or international law</li>
              <li>Interfering with or disrupting the service</li>
              <li>Collecting personal information about other users</li>
            </ul>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">6. Disclaimer</h2>
            <p className="text-muted-foreground">
              BookWorm is provided on an &quot;AS IS&quot; basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">7. Limitations</h2>
            <p className="text-muted-foreground">
              In no event shall BookWorm or its suppliers be liable for any damages arising out of the use or inability to use the materials on our platform, even if we have been notified of the possibility of such damage.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms of service at any time. We will notify users of any material changes by posting the new Terms of Service on this page.
            </p>
          </section>

          <section className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at legal@bookworm.app.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
