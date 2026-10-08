import Image from "next/image";

export function HeroLaptop() {
  return (
    <div className="relative mx-auto w-full max-w-[56rem] translate-y-4 sm:translate-y-8">
      <div className="rounded-[1.35rem] border border-white/10 bg-[#10141c] p-1.5 shadow-[0_40px_80px_rgba(0,0,0,0.45)] sm:p-2.5">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] bg-navy-900">
          <Image
            src="/about/campuses/goa.jpg"
            alt="Partido State University Goa Campus"
            fill
            priority
            sizes="(max-width: 768px) 92vw, 56rem"
            className="object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-navy-950/15" aria-hidden="true" />
        </div>
      </div>
      <div className="mx-auto h-2.5 w-[62%] rounded-b-lg bg-[#161b24]" />
      <div className="mx-auto h-1.5 w-[72%] rounded-b-3xl bg-[#0c1016]" />
    </div>
  );
}
