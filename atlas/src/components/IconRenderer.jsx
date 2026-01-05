import React, { Suspense, useMemo } from "react";

// Vite pre-indexes the icon files (does NOT load them)
const iconModules = import.meta.glob(
  "/node_modules/@ant-design/icons/es/icons/*.js"
);

export const IconRenderer = ({ name, ...props }) => {
  const LazyIcon = useMemo(() => {
    if (!name) return null;

    const path = `/node_modules/@ant-design/icons/es/icons/${name}.js`;

    const loader = iconModules[path];
    if (!loader) {
      console.warn(`Icon not found: ${name}`);
      return null;
    }

    return React.lazy(() =>
      loader().then((mod) => ({
        default: mod.default,
      }))
    );
  }, [name]);

  if (!LazyIcon) return null;

  return (
    <Suspense fallback={null}>
      <LazyIcon {...props} />
    </Suspense>
  );
};
