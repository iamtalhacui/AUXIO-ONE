export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20 sm:px-10 lg:px-16">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Auxio-One platform
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Care operations, connected.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          Auxio-One brings customer relationships, workforce planning, clinical
          notes, incidents, and finance into one clear workspace for modern care
          teams.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            href="/crm"
          >
            Open workspace
          </a>
          <a
            className="rounded-full border border-slate-600 px-6 py-3 font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
            href="/login"
          >
            Team sign in
          </a>
        </div>
        <div className="mt-20 grid gap-4 border-t border-slate-800 pt-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-white">One shared view</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep people, plans, and progress in sync.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Built for care teams</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Support thoughtful work without the administrative noise.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Ready to grow</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Start with the workflows your organisation needs today.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
