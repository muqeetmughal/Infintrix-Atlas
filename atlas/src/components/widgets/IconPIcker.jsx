import * as Icons from "lucide-react";
import { useState } from "react";

const iconNames = Object.keys(Icons);
// console.log(iconNames)
export function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-2">
      <input
        className="border px-2 py-1 w-full"
        placeholder="Search icon..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-auto">
        {iconNames
          .filter(name =>
            name.toLowerCase().includes(search.toLowerCase())
          )
          .map(name => {
            const Icon = Icons[name];

            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className={`p-2 border rounded hover:bg-slate-100 ${
                  value === name ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
      </div>
    </div>
  );
}
