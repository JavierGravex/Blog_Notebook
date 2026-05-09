import NewsletterSignup from "@/components/newsletter-signup";

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-6 pb-16">
      <div className="mt-16">
        <NewsletterSignup />
      </div>
      <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()}</p>
    </footer>
  );
}

