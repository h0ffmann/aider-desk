type Props = {
  children: string;
};

export const CodeInline = ({ children }: Props) => {
  return <span className="bg-neutral-900 text-white rounded-sm px-1 py-0.5 text-xxs font-semibold">{children}</span>;
};
