import { useFrappeGetDocList } from "frappe-react-sdk";
import React, { useMemo } from "react";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Select, Spin } from "antd";

const LinkField = ({ field, value, onChange }) => {
  const doctype = field.options;
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

  return (
    <Select
      options={docQuery.data || []}
      value={value ?? null}
      onChange={onChange}
      showSearch
      placeholder={`Select ${field.label}`}
      filterOption={(input, option) =>
        (option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      className="w-full"
    />
  );
};

export default LinkField;


// import { useFrappeGetDocList } from "frappe-react-sdk";
// import React, { useMemo } from "react";
// import { useDoctypeSchema } from "../../hooks/doctype";
// import { Select, Spin } from "antd";

// const LinkField = ({ field }) => {
//   const doctype = field.options;
//   const link_filters = field?.link_filters
//     ? JSON.parse(field.link_filters)
//     : [];

//   const schemaQuery = useDoctypeSchema(doctype);

//   const title_field = useMemo(
//     () => schemaQuery.data?.title_field || "name",
//     [schemaQuery.data?.title_field]
//   );

//   const docQuery = useFrappeGetDocList(
//     doctype,
//     {
//       filters: link_filters,
//       limit_page_length: 1000,
//       fields: ["name as value", `${title_field} as label`],
//     },
//     ["link-field", doctype, title_field, field.link_filters],
//     {
//       enabled: !!schemaQuery.data?.title_field,
//     }
//   );

//   if (schemaQuery.isLoading || docQuery.isLoading) {
//     return <Spin />;
//   }

//   return (
//     <Select
//       options={docQuery.data || []}
//       showSearch
//       placeholder={`Select ${field.label}`}
//       filterOption={(input, option) =>
//         (option?.label ?? "")
//           .toLowerCase()
//           .includes(input.toLowerCase())
//       }
//       className="w-full"
//     />
//   );
// };

// export default LinkField;
