import Image from "next/image";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  imageAlt: string;
};

export default function PageHero({
  eyebrow,
  title,
  copy,
  image,
  imageAlt,
}: PageHeroProps) {
  return (
    <section className="relative isolate min-h-[46vh] overflow-hidden bg-navy text-white">
      <Image
        src={image}
        alt={imageAlt}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/82 to-navy/35" />
      <div className="site-container relative py-20 md:py-28">
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          {title}
        </h1>
        <hr className="gold-rule mt-5" />
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg">
          {copy}
        </p>
      </div>
    </section>
  );
}
