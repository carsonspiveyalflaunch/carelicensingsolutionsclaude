"use client";

export type CatalogChoice = { code: string; state: string; program: string };

export default function StateProgramSelect({
  choices,
  code,
  program,
  onState,
  onProgram,
  tone = "default",
}: {
  choices: CatalogChoice[];
  code: string;
  program: string;
  onState: (code: string) => void;
  onProgram: (program: string) => void;
  tone?: "default" | "onDark";
}) {
  const states = new Map<string, string>();
  for (const item of choices) states.set(item.code, item.state);
  const stateOptions = [...states.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const programs = choices
    .filter((item) => item.code === code)
    .map((item) => item.program)
    .sort((a, b) => a.localeCompare(b));

  const labelClass = tone === "onDark" ? "block text-sm font-bold text-white" : "block text-sm font-semibold text-slate-700";
  const selectClass =
    tone === "onDark"
      ? "mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      : "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700";

  return (
    <div className="space-y-3">
      <label className={labelClass} htmlFor="mrr-state">
        Your state
        <select
          id="mrr-state"
          value={code}
          onChange={(event) => onState(event.target.value)}
          className={selectClass}
        >
          <option value="">Select your state</option>
          {stateOptions.map(([abbr, name]) => (
            <option key={abbr} value={abbr}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass} htmlFor="mrr-program">
        Program
        <select
          id="mrr-program"
          value={program}
          onChange={(event) => onProgram(event.target.value)}
          disabled={!code}
          className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <option value="">{code ? "Select a program" : "Choose a state first"}</option>
          {programs.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
