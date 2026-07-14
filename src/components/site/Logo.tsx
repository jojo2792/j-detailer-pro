import logoAsset from "@/assets/j-detailer-logo.asset.json";

export function Logo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="J The Detailer"
      className={`${className} rounded-full object-cover`}
      width={96}
      height={96}
    />
  );
}