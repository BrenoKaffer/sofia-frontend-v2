import Image from "next/image";
export function Logo() {
  return (
    <div className="relative h-8 max-w-[12rem]">
      <Image
        src={"/logo_sofia.png"}
        fill
        className="dark:hidden object-contain"
        alt="SOFIA logo"
        role="presentation"
        quality={100}
      />
      <Image
        src={"/logo_sofia.png"}
        fill
        className="hidden dark:block object-contain"
        alt="SOFIA logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}

