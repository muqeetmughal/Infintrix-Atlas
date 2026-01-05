import { useFrappeGetDocList } from "frappe-react-sdk";
import React, { useMemo } from "react";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Select, Spin } from "antd";

const LinkField = ({ field }) => {
  const doctype = field.options;

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const doctype_schema_query = useDoctypeSchema(doctype);
  const title_field = useMemo(
    () => doctype_schema_query.data?.title_field || "name",
    [doctype_schema_query.data]
  );

  const doc_query = useFrappeGetDocList(doctype, {
    orFilters: searchTerm ? [[title_field, "like", `%${searchTerm}%`]] : [],
    limit_page_length: 50,
    fields: ["name as value", `${title_field} as label`],
  });
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(() => {
    return doc_query.data ? doc_query.data : [];
  }, [doc_query.data]);

  if (doctype_schema_query.isLoading) return <Spin/>;

  // const filteredOptions = options.filter(opt =>
  //     opt.toLowerCase().includes(searchTerm.toLowerCase())
  // )

  return (
    <Select
      options={options}
      showSearch={true}
      placeholder={`Select ${field.label}`}
      filterOption={(input, option) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
      }
      // fieldNames={{
      //     label: "project_name",
      //     value: 'name'
      // }}
      className="w-full"
    />
  );
};

export default LinkField;
