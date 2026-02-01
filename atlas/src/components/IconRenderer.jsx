import React, { Suspense, useMemo } from "react";

// Vite pre-indexes the icon files (does NOT load them)
const iconModules = import.meta.glob(
  "/node_modules/@ant-design/icons/es/icons/*.js",
);

// Cache loaded icons to prevent rerenders on theme changes
const iconCache = new Map();

export const IconRenderer = ({ name, ...props }) => {
  const LazyIcon = useMemo(() => {
    if (!name) return null;

    // Return cached icon component if available
    if (iconCache.has(name)) {
      return iconCache.get(name);
    }

    const path = `/node_modules/@ant-design/icons/es/icons/${name}.js`;

    const loader = iconModules[path];
    if (!loader) {
      console.warn(`Icon not found: ${name}`);
      return null;
    }

    const lazyComponent = React.lazy(() =>
      loader().then((mod) => ({
        default: mod.default,
      })),
    );

    // Cache the lazy component
    iconCache.set(name, lazyComponent);
    return lazyComponent;
  }, [name]);

  if (!LazyIcon) return null;

  return (
    <Suspense fallback={null}>
      <LazyIcon {...props} />
    </Suspense>
  );
};
