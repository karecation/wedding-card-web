type InvitationSectionProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
};

export default function InvitationSection({ eyebrow, title, children }: InvitationSectionProps) {
  return (
    <section className="space-y-5 px-6 py-10">
      <div className="text-center">
        {eyebrow && (
          <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-[#9a7b4f]">{eyebrow}</p>
        )}
        <h2 className="font-serif text-2xl leading-snug text-[#2d2926]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
