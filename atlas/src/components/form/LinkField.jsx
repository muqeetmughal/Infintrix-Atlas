import { useFrappeGetDocList } from "frappe-react-sdk";
import { useMemo, useEffect } from "react";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Select, Spin } from "antd";
import { useSearchParams } from "react-router-dom";

const LinkField = ({ field, value, onChange }) => {
  const [searchParams] = useSearchParams();

  const doctype = field.options;
  const default_value_in_search_params = searchParams.get(field.fieldname);

  // Set value from search params or field.default on mount
  useEffect(() => {
    if (!value) {
      if (default_value_in_search_params) {
        onChange(default_value_in_search_params);
      } else if (field.default) {
        onChange(field.default);
      }
    }
  }, [default_value_in_search_params, field.default, value, onChange]);

  const link_filters = field?.link_filters
    ? JSON.parse(field.link_filters)
    : [];

  const schemaQuery = useDoctypeSchema(doctype);

  const title_field = useMemo(
    () => schemaQuery.data?.title_field || "name",
    [schemaQuery.data?.title_field]
  );

  const docQuery = useFrappeGetDocList(
    doctype,
    {
      filters: link_filters,
      limit_page_length: 1000,
      fields: ["name as value", `${title_field} as label`],
    },
    ["link-field", doctype, title_field, field.link_filters],
    {
      enabled: !!schemaQuery.data?.title_field,
    }
  );

  if (schemaQuery.isLoading || docQuery.isLoading) {
    return <Spin />;
  }

  const isDisabled = field.read_only || !!default_value_in_search_params;

  return (
    <Select
      options={docQuery.data || []}
      value={value ?? null}
      onChange={onChange}
      showSearch
      disabled={isDisabled}
      placeholder={`Select ${field.label}`}
      filterSearch={(input, option) =>
        (option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      className="w-full"
    />
  );
};

export default LinkField;
