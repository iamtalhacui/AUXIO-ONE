import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, meta, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {meta ? <p className="page-subtitle">{meta}</p> : null}
        {description && !meta ? <p className="page-subtitle">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
