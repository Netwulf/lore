export default function HomePage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center mt-20">
        <h2 className="font-display text-3xl font-bold text-warm-ivory mb-4">
          Welcome to Lore
        </h2>
        <p className="text-warm-ivory/60 mb-8">
          Your AI-first knowledge workspace. Start creating pages and connecting ideas.
        </p>
        <div className="p-8 border border-warm-ivory/20 bg-twilight-violet/10">
          <p className="text-warm-ivory/80">
            Select a page from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
