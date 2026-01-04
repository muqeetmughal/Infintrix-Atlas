import { Select, Input } from "antd";
import * as AllIcons from "@ant-design/icons/lib/icons";
import { useMemo, useState } from "react";

const Icons = Object.fromEntries(
  Object.entries(AllIcons).filter(([name]) => name.includes("Outlined"))
);

export const IconPicker = ({ value, onChange }) => {
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    return Object.keys(Icons).filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const SelectedIcon = value ? Icons[value] : null;

  return (
    <Select
      value={value}
      style={{ width: 260 }}
      placeholder="Select an icon"
      dropdownRender={() => (
        <div style={{ padding: 8 }}>
          {/* Search */}
          <Input
            placeholder="Search icon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {filteredIcons.map((iconName) => {
              const Icon = Icons[iconName];
              return (
                <div
                  key={iconName}
                  onClick={() => onChange(iconName)}
                  title={iconName}
                  style={{
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    border:
                      value === iconName
                        ? "1px solid #1677ff"
                        : "1px solid transparent",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background:
                      value === iconName ? "#e6f4ff" : "transparent",
                  }}
                >
                  <Icon />
                </div>
              );
            })}
          </div>
        </div>
      )}
    >
      {/* Dummy option just to satisfy Select */}
      {value && (
        <Select.Option value={value}>
          {SelectedIcon && <SelectedIcon />}
        </Select.Option>
      )}
    </Select>
  );
};
