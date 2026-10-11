import Link from "next/link";

export default function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <section className="site-container grid max-w-2xl gap-4 py-20">
      <h1 className="font-display text-3xl font-extrabold text-navy">{title}</h1>
      <p className="text-muted">{message}</p>
      <Link href="/" className="text-sm font-semibold text-teal hover:text-navy">
        Back to home
      </Link>
    </section>
  );
}
