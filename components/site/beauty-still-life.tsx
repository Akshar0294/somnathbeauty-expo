export function BeautyStillLife({ image }: { image?: string | null }) {
  if (image) {
    return (
      <figure className="w-full overflow-hidden border-y border-[#dce7e7] bg-[#edf3f3]">
        <img className="block h-auto w-full" src={image} alt="Soft Shine Cosmetic beauty banner" />
      </figure>
    );
  }

  return <figure className="min-h-[300px] w-full border-y border-dashed border-[#b9caca] bg-[#edf3f3]" aria-label="Hero banner image placeholder" />;
}

export function BrandedFallback() {
  return <img className="h-full w-full object-cover" src="/eventbanner.png" alt="Somnath Beauty Expo event banner" />;
}
