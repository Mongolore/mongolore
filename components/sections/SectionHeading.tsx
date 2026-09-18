import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  title: string;
  children?: ReactNode;
};

export function SectionHeading({ id, title, children }: SectionHeadingProps) {
  return (
    <div>
      <h2
        id={id}
        className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
