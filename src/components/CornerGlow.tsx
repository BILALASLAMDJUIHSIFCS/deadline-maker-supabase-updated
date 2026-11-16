// Soft light bleeding from opposite corners — the glow treatment from the
// reference cards. Sits behind card content via negative z on an isolated card.
// Tinted by the theme's accent; themes dim or hide it through --glow.
export default function CornerGlow() {
  return (
    <div aria-hidden className="corner-glow pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
      <div
        className="absolute -left-24 -top-24 h-56 w-56 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 68%)",
        }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 70%)",
        }}
      />
      {/* faint hairline sheen along the top edge */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </div>
  );
}
