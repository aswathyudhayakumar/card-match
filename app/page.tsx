import Link from "next/link";
import { ArrowRight, CreditCard, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-700 font-medium">
            <Zap className="h-3.5 w-3.5" />
            Powered by AI
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Card<span className="text-blue-600">Match</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Find your next credit card in 60 seconds. Answer 6 quick questions, get 3
            personalized recommendations with AI-generated reasoning.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/quiz">
                Start quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature bullets */}
      <section className="border-t bg-muted/30 px-4 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon={<CreditCard className="h-5 w-5 text-blue-600" />}
            title="15 cards analyzed"
            desc="From Chase, Amex, Capital One, Citi, and more"
          />
          <Feature
            icon={<Zap className="h-5 w-5 text-blue-600" />}
            title="Live pricing"
            desc="Rates verified against issuer pages via AI web search"
          />
          <Feature
            icon={<Shield className="h-5 w-5 text-blue-600" />}
            title="No account needed"
            desc="No sign-up, no data storage, no spam"
          />
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        Informational only. Verify all terms with the issuer before applying. Questionnaire
        design informed by CFPB&rsquo;s &ldquo;How to find the best credit card for you&rdquo;
        guidance.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
