import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

const LOGO_SRC = "/images/auxio-logo.png";

export function BrandLogo({ className, size = 40, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="AUXIO One"
      width={size}
      height={size}
      priority={priority}
      className={className ?? "h-10 w-10 object-contain"}
    />
  );
}
