"use client";
import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";

export const useIconPicker = () => {
  const icons = useMemo(() => {
    return Object.entries(LucideIcons)
      .filter(([, Icon]) => typeof Icon === "function")
      .map(([iconName, IconComponent]) => ({
        name: iconName,
        friendly_name:
          iconName.match(/[A-Z][a-z]+/g)?.join(" ") || iconName,
        Component: IconComponent,
      }));
  }, []);

  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search) return icons;
    const q = search.toLowerCase();
    return icons.filter(icon =>
      icon.name.toLowerCase().includes(q)
    );
  }, [icons, search]);

  return {
    search,
    setSearch,
    icons: filteredIcons,
  };
};
