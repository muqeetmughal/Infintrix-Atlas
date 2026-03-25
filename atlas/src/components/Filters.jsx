import { Button, Input, Select } from "antd";
import { Filter, X } from "lucide-react";
import React, { useMemo, useEffect, useCallback } from "react";
import { useDoctypeSchema } from "../hooks/doctype";
import { useFrappePostCall } from "frappe-react-sdk";
import { useSearchParams } from "react-router-dom";

const OPERATOR_OPTIONS = {
  Data: [
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: "like", label: "Like" },
    { value: "not like", label: "Not Like" },
    { value: "in", label: "In" },
    { value: "not in", label: "Not In" },
    { value: "is", label: "Is" },
    { value: "descendants of", label: "Descendants Of" },
    {
      value: "descendants of (inclusive)",
      label: "Descendants Of (inclusive)",
    },
    { value: "not descendants of", label: "Not Descendants Of" },
    { value: "ancestors of", label: "Ancestors Of" },
    { value: "not ancestors of", label: "Not Ancestors Of" },
  ],
  Select: [
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: "like", label: "Like" },
  ],
  Int: [
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: ">", label: "Greater Than" },
    { value: "<", label: "Less Than" },
    { value: ">=", label: "Greater Than or Equal" },
    { value: "<=", label: "Less Than or Equal" },
  ],
  Float: [
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: ">", label: "Greater Than" },
    { value: "<", label: "Less Than" },
    { value: ">=", label: "Greater Than or Equal" },
    { value: "<=", label: "Less Than or Equal" },
  ],
  Check: [
    { value: "0", label: "No" },
    { value: "1", label: "Yes" },
  ],
  Date: [
    { value: "between", label: "Between" },
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: ">", label: "After" },
    { value: "<", label: "Before" },
    { value: ">=", label: "On or After" },
    { value: "<=", label: "On or Before" },
  ],
  Link: [
    { value: "=", label: "Equals" },
    { value: "!=", label: "Not Equals" },
    { value: "like", label: "Like" },
    { value: "not like", label: "Not Like" },
    { value: "in", label: "In" },
    { value: "not in", label: "Not In" },
    { value: "is", label: "Is" },
  ],
};

const FilterField = ({ filter, allowed_fields = [], onFilterChange,onDelete }) => {
  const [selectedField, setSelectedField] = React.useState(filter?.field || "");
  const [selectedOperator, setSelectedOperator] = React.useState(
    filter?.operator || "",
  );
  const [value, setValue] = React.useState(filter?.value || "");
  const [records, setRecords] = React.useState([]);
  const records_query = useFrappePostCall("frappe.desk.search.search_link");

  const field = useMemo(() => {
    return allowed_fields.find((f) => f.fieldname === selectedField);
  }, [selectedField, allowed_fields]);

  const field_type = field?.fieldtype;
  const options =
    field_type === "Select"
      ? String(field?.options).split("\n")
      : field?.options;
  const operator_options =
    OPERATOR_OPTIONS[field_type] || OPERATOR_OPTIONS.Data;

  useEffect(() => {
    if (field_type === "Link") {
      records_query
        .call({
          doctype: field.options,
          txt: value,
        })
        .then((res) => {
          setRecords(res?.message || []);
        });
    }
  }, [selectedField, value, field_type, field?.options, records_query]);

  const handleFieldChange = useCallback(
    (newField) => {
      setSelectedField(newField);
      setSelectedOperator("");
      setValue("");
      onFilterChange?.({ field: newField, operator: "", value: "" });
    },
    [onFilterChange],
  );

  const handleOperatorChange = useCallback(
    (newOperator) => {
      setSelectedOperator(newOperator);
      onFilterChange?.({ field: selectedField, operator: newOperator, value });
    },
    [selectedField, value, onFilterChange],
  );

  const handleValueChange = useCallback(
    (newValue) => {
      setValue(newValue);
      onFilterChange?.({
        field: selectedField,
        operator: selectedOperator,
        value: newValue,
      });
    },
    [selectedField, selectedOperator, onFilterChange],
  );

  return (
    <div className="flex justify-between items-center mb-2">
  <div className="flex gap-2 mb-2">
      <Select
        showSearch
        placeholder="Select field"
        value={selectedField}
        style={{ width: "200px" }}
        options={allowed_fields.map((f) => ({
          value: f.fieldname,
          label: f.label,
        }))}
        onChange={handleFieldChange}
      />
      <Select
        placeholder="Select operator"
        value={selectedOperator}
        style={{ width: "150px" }}
        options={operator_options}
        onChange={handleOperatorChange}
      />
      {}
      <div>
        {(field_type === "Data"|| !field_type) && (
          <Input
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        )}
        {field_type === "Select" && (
          <Select
            showSearch
            value={value}
            placeholder="Select value"
            options={options}
            style={{ width: "200px" }}
            onChange={handleValueChange}
          />
        )}
        {field_type === "Link" && (
          <Select
            showSearch
            value={value}
            placeholder="Search..."
            options={records}
            style={{ width: "200px" }}
            onChange={handleValueChange}
          />
        )}
        {field_type === "Check" && (
          <Select
            value={value}
            options={OPERATOR_OPTIONS.Check}
            style={{ width: "200px" }}
            onChange={handleValueChange}
          />
        )}
      </div>
    </div>
    <Button onClick={onDelete} type="text" icon={<X/>}></Button>
    </div>
  
  );
};

const Filters = ({ doctype = "Task" }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = React.useState([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const schemaQuery = useDoctypeSchema(doctype);

  const allowed_fields = useMemo(() => {
    const disallowed_words = ["break", "lft", "rgt", "sb_actual"];
    const disallowed_labels = ["Break"];
    const disallowed_fieldtypes = ["Table", "Table MultiSelect"];

    return (schemaQuery?.data?.fields || []).filter(
      (field) =>
        !disallowed_words.some((word) => field.fieldname.includes(word)) &&
        !disallowed_fieldtypes.includes(field.fieldtype) &&
        !disallowed_labels.includes(field.label),
    );
  }, [schemaQuery?.data?.fields]);



  const handleAddFilter = useCallback(() => {
    setFilters((prev) => [...prev, { field: "", operator: "", value: "" }]);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters([
      { field: "", operator: "", value: "" },
    ]);
  }, []);

  const handleFilterChange = useCallback((index, filterData) => {
    setFilters((prev) => {
      const updated = [...prev];
      updated[index] = filterData;
      return updated;
    });
  }, []);

  const deleteFilter = useCallback((index) => {
    setFilters((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  return (
    <div className="relative inline-block">
      <Button
        type="default"
        onClick={() => setShowFilters(!showFilters)}
        icon={<Filter size={16} />}
      >
        Filters
      </Button>

      {showFilters && (
        <div className="absolute top-full right-0 mt-2  bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md dark:shadow-lg z-10 p-4">
          {filters.map((filter, index) => (
            <FilterField
              key={index}
              filter={filter}
              allowed_fields={allowed_fields}
              onFilterChange={(data) => handleFilterChange(index, data)}
              onDelete={() => deleteFilter(index)}
            />
          ))}

          <div>

            Generated Filters: 

            <div>
              {
                filters.map((f, i) => (
                  <div key={i}>
                    {f.field} {f.operator} {f.value}
                  </div>
                ))
              }
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <Button onClick={handleAddFilter}>Add a Filter</Button>
            <div className="flex justify-between items-center">
              <Button onClick={handleClearFilters} className="ml-2" danger>
                Clear Filters
              </Button>
              <Button className="ml-2" type="primary" onClick={()=>{
                console.log("Applying filters:", filters);
                const filters_to_apply = filters.reduce((acc, filter) => {
                  if(filter.field && filter.operator && filter.value) {
                    acc.push([filter.field, filter.operator, filter.value]);
                  }
                  return acc;
                }, []);
                console.log("Filters to apply:", filters_to_apply);
                // setSearchParams({
                //   filters: JSON.stringify(filters)
                // })
              }}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
