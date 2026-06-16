const DEFAULT_CURRENCY = "USD";

const getFrappeBoot = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.frappe?.boot ?? null;
};

export const getDefaultCurrency = (fallback = DEFAULT_CURRENCY) => {
  const boot = getFrappeBoot();

  return (
    boot?.sysdefaults?.currency ||
    boot?.sysdefaults?.default_currency ||
    fallback
  );
};

export const getCurrencyLocale = () => {
  const boot = getFrappeBoot();

  return boot?.lang || (typeof navigator !== "undefined" ? navigator.language : "en-US");
};

export const formatCurrency = (
  value,
  {
    currency = getDefaultCurrency(),
    locale = getCurrencyLocale(),
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    currencyDisplay = "symbol",
  } = {},
) => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toLocaleString(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }
};

export const parseCurrencyInput = (value) =>
  String(value ?? "").replace(/[^\d.-]/g, "");
