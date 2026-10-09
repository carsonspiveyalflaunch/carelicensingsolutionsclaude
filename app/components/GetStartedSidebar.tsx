import React from "react";

interface GetStartedSidebarProps {
  stateNames: { [abbr: string]: string };
  selectedState: string;
  selectedType: string;
  programTypes: { key: string; desc: string }[];
  onStateChange?: (abbr: string) => void;
  onTypeChange?: (type: string) => void;
  disableState?: boolean;
  disableType?: boolean;
}

const GetStartedSidebar: React.FC<GetStartedSidebarProps> = ({
  stateNames,
  selectedState,
  selectedType,
  programTypes,
  onStateChange,
  onTypeChange,
  disableState = false,
  disableType = false,
}) => {
  return (
    <aside className="w-full lg:w-64 bg-white rounded-xl border border-[#eaffea] p-4 md:p-6 flex flex-col shadow-sm">
      <div className="mb-3 md:mb-4">
        <span className="block text-xs text-[#417a5a] font-semibold mb-2">STATE</span>
        <select
          className="w-full border border-[#b6ff7a] rounded-lg px-3 py-2 text-[#417a5a] font-semibold bg-white text-sm md:text-base"
          value={stateNames[selectedState]}
          onChange={e => {
            if (onStateChange && !disableState) {
              const abbr = Object.keys(stateNames).find(key => stateNames[key] === e.target.value);
              if (abbr) onStateChange(abbr);
            }
          }}
          disabled={disableState}
        >
          {Object.entries(stateNames).map(([abbr, name]) => (
            <option key={abbr} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="block text-xs text-[#417a5a] font-semibold mb-2">PROGRAM TYPE{programTypes.length ? ` (${programTypes.length})` : ''}</span>
        <ul className="space-y-2">
          {programTypes.map((type) => {
            const isSelected = selectedType === type.key;
            return (
              <li
                key={type.key}
                className={`flex items-center gap-2 text-[#417a5a] text-sm font-semibold rounded-lg px-2 py-1 cursor-pointer transition-all duration-150 ${isSelected ? "bg-[#eaffea] border border-[#417a5a]" : "hover:bg-[#eaffea]"} ${disableType ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (onTypeChange && !disableType) onTypeChange(type.key);
                }}
                tabIndex={0}
              >
                {type.key}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-6 md:mt-8">
        <span className="block text-xs text-[#417a5a] font-semibold mb-2">Current selection</span>
        <div className="text-[#417a5a] text-sm font-bold">{stateNames[selectedState]}</div>
        <div className="text-[#417a5a] text-xs">{selectedType}</div>
      </div>
    </aside>
  );
};

export default GetStartedSidebar;
