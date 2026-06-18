import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-rust font-poppins font-medium mb-3">404</p>
        <h1 className="font-display font-black text-4xl text-ink mb-3">Page not found.</h1>
        <p className="text-ink/60 font-poppins text-sm mb-8">
          We could not find what you were looking for.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Back to trips
        </Link>
      </div>
    </div>
  );
}
