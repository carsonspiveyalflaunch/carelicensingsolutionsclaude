"use client";

export type CatalogChoice = { code: string; state: string; program: string };

export default function StateProgramSelect({
  choices,
  code,
  program,
  onState,
  onProgram,
}: {
  choices: CatalogChoice[];
  code: string;
  program: string;
  onState: (code: string) => void;
  onProgram: (program: string) => void;
}) {
  const states = new Map<string, string>();
  for (const item of choices) states.set(item.code, item.state);
  const stateOptions = [...states.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const programs = choices
    .filter((item) => item.code === code)
    .map((item) => item.program)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Your state
        <select
          value={code}
          onChange={(event) => onState(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          <option value="">Select your state</option>
          {stateOptions.map(([abbr, name]) => (
            <option key={abbr} value={abbr}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Program
        <select
          value={program}
          onChange={(event) => onProgram(event.target.value)}
          disabled={!code}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
