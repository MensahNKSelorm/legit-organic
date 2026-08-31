import type { ReactNode } from "react";

interface EditorialPageHeaderProps {
  index: string;
  title: ReactNode;
  description: string;
  action?: ReactNode;
}

export default function EditorialPageHeader({
  index,
  title,
  description,
  action,
}: EditorialPageHeaderProps) {
  return (
    <header className="bg-[#0D3B2A] pt-32 text-white md:pt-36">
      <div className="page-container">
        <div className="grid gap-10 border-b border-white/20 pb-12 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.65fr)] md:items-end md:pb-16">
          <div>
            <p className="editorial-label mb-5 text-[#F4C430]">{index}</p>
            <h1 className="display-organic max-w-5xl text-6xl leading-[.9] md:text-8xl">{title}</h1>
          </div>
          <div className="md:pb-1">
            <p className="max-w-xl text-lg leading-8 text-[#B8D4BD]">{description}</p>
            {action && <div className="mt-7">{action}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}
