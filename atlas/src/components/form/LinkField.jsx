import { useFrappeGetDocList } from "frappe-react-sdk";
import React, { useMemo } from "react";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Select, Spin } from "antd";

const LinkField = ({ field }) => {
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
//   console.log("Rendering LinkField for field:", field.link_filters);
//   const doctype = field.options;

//   const link_filters = field?.link_filters || null;

//   const [searchTerm, setSearchTerm] = React.useState("");
//   const [isOpen, setIsOpen] = React.useState(false);

//   const doctype_schema_query = useDoctypeSchema(doctype);
//   const title_field = useMemo(
//     () => doctype_schema_query.data?.title_field || "name",
//     [doctype_schema_query.data]
//   );

//   const doc_query = useFrappeGetDocList(
//     doctype,
//     {
//       filters: link_filters ? JSON.parse(link_filters) : [],
//       // orFilters: searchTerm ? [[title_field, "like", `%${searchTerm}%`]] : [],
//       limit_page_length: 1000,
//       fields: ["name as value", `${title_field} as label`],
//     },
//     ["link", "options", doctype, link_filters],
//     {
//       // isPaused : ()=>{
//       //   return !title_field
//       // }
//     }
//   );
//   const dropdownRef = React.useRef(null);

//   React.useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const options = useMemo(() => {
//     return doc_query.data ? doc_query.data : [];
//   }, [doc_query.data]);

//   console.log(field.fieldname, title_field);
//   if (doctype_schema_query.isLoading && doc_query.isLoading)
//     return <Spin />;

//   // const filteredOptions = options.filter(opt =>
//   //     opt.toLowerCase().includes(searchTerm.toLowerCase())
//   // )

//   return (
//     <Select
//       options={options}
//       showSearch={true}
//       placeholder={`Select ${field.label}`}
//       filterOption={(input, option) =>
//         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//       }
//       // fieldNames={{
//       //     label: "project_name",
//       //     value: 'name'
//       // }}
//       className="w-full"
//     />
//   );
// };

// export default LinkField;
