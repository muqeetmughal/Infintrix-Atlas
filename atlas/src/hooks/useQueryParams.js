import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback(
    (key) => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  const getArray = useCallback(
    (key) => {
      const raw = searchParams.get(key);
      if (!raw) return [];
      return raw.split(",").filter(Boolean);
    },
    [searchParams]
  );

  const set = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);

      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setArray = useCallback(
    (key, values) => {
      const params = new URLSearchParams(searchParams);

      if (!values || values.length === 0) {
        params.delete(key);
      } else {
        params.set(key, values.join(","));
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const addToArray = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      const list = (params.get(key) || "").split(",").filter(Boolean);

      if (!list.includes(value)) {
        list.push(value);
        params.set(key, list.join(","));
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams]
  );

  const removeFromArray = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      const list = (params.get(key) || "")
        .split(",")
        .filter(Boolean)
        .filter((v) => v !== value);

      if (list.length === 0) {
        params.delete(key);
      } else {
        params.set(key, list.join(","));
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clear = useCallback(
    (key) => {
      const params = new URLSearchParams(searchParams);
      params.delete(key);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const all = useMemo(() => {
    const obj = {};
    for (const [k, v] of searchParams.entries()) {
      obj[k] = v;
    }
    return obj;
  }, [searchParams]);

  return {
    get,
    getArray,
    set,
    setArray,
    addToArray,
    removeFromArray,
    clear,
    all,
    raw: searchParams,
  };
}
