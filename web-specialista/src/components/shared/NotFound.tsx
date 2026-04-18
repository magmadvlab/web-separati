"use client";

import Link from "next/link";

type NotFoundProps = {
  title?: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
};

export function NotFound({
  title = "Contenuto non trovato",
  description = "La risorsa richiesta non e' disponibile o non e' piu' accessibile.",
  href = "/specialista/dashboard",
  ctaLabel = "Torna alla dashboard specialista",
}: NotFoundProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>

      <Link
        href={href}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default NotFound;
