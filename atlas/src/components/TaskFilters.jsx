import { Button, Input, Radio, Select } from "antd";
import { Filter, X } from "lucide-react";
import React, { useMemo, useEffect } from "react";
import { useDoctypeSchema } from "../hooks/doctype";
import { useFrappePostCall } from "frappe-react-sdk";
import { useSearchParams } from "react-router-dom";

const TaskFilters = () => {
  const schemaQuery = useDoctypeSchema("Task");

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState({});
  const [records, setRecords] = React.useState([]);

  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedField, setSelectedField] = React.useState(null);
  const records_query = useFrappePostCall("frappe.desk.search.search_link");

  const allowed_fields = useMemo(() => {
    const allow_fields = [
      "subject",
      "custom_phase",
      "custom_cycle",
      "priority",
      "status",
      "type",
    ];
    // const disallowed_words = ["break", "lft", "rgt", "sb_actual"];
    // const disallowed_labels = ["Break"];
    // const disallowed_fieldtypes = ["Table", "Table MultiSelect"];

    return (schemaQuery?.data?.fields || []).filter((field) =>
      allow_fields.some((allowed) => allowed === field.fieldname),
    );
    // return schemaQuery?.data?.fields || [];
  }, [schemaQuery?.data?.fields]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
      setShowFilters(false);
    }
  };

  if (showFilters) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }
}, [showFilters]);


  const project = searchParams.get("project") || null;
  //   const selectedFilterIndex =
  //     typeof selectedField === "number" ? selectedField : null;
  //   const activeFilter =
  //     selectedFilterIndex !== null ? filters[selectedFilterIndex] : null;

  const selectedFieldMeta =
    typeof selectedField === "number" ? allowed_fields[selectedField] : null;
  const options =
    selectedFieldMeta?.fieldtype === "Select"
      ? String(selectedFieldMeta?.options)
          .split("\n")
          .map((option) => ({
            label: option,
            value: option,
          }))
      : selectedFieldMeta?.options;
  useEffect(() => {
    if (selectedFieldMeta?.fieldtype === "Link") {
      records_query
        .call({
          doctype: selectedFieldMeta.options,
          txt: "",
          filters: selectedFieldMeta.fieldname == "custom_phase"|| selectedFieldMeta.fieldname == "custom_cycle" ? { project: ["=", project] } : {},
          page_length : 0
        })
        .then((res) => {
          setRecords(res?.message || []);
        });
    }
  }, [selectedFieldMeta]);

  return (
    <div className="relative inline-block">
      <Button
        type="default"
        onClick={() => {
          setShowFilters((prev) => {
            const next = !prev;
            if (next && allowed_fields.length) {
              setSelectedField((curr) =>
                curr === null ? 0 : Math.min(curr, allowed_fields.length - 1),
              );
            }
            return next;
          });
        }}
        icon={<Filter size={16} />}
      >
        Filters
      </Button>

      {showFilters && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md dark:shadow-lg z-10 p-4 min-w-175">
          <div className="flex gap-4">
            <div className="w-72 border-r border-gray-200 dark:border-gray-700 pr-3">
              <div className="font-medium mb-2">Fields</div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {allowed_fields.length === 0 && (
                  <div className="text-sm text-gray-500">No fields found.</div>
                )}

                {allowed_fields.map((field, index) => {
                  //   const filter = filters.find(
                  //     (item) => item.field === field.fieldname,
                  //   );
                  //   const subtitle =
                  //     filter?.operator && filter?.value !== ""
                  //       ? `${filter.operator} ${filter.value}`
                  //       : "Not configured";

                  return (
                    <div
                      key={field.fieldname}
                      className={`flex items-center justify-between rounded px-2 py-1 cursor-pointer ${
                        selectedField === index
                          ? "bg-blue-50 dark:bg-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                      onClick={() => setSelectedField(index)}
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate">
                          {field.label || field.fieldname}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {/* {subtitle} */}
                        </div>
                      </div>

                      {/* {filter && (
                        <Button
                          type="text"
                          size="small"
                          icon={<X size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) =>
                              prev.filter(
                                (item) => item.field !== field.fieldname,
                              ),
                            );
                          }}
                        />
                      )} */}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 min-w-[320px]">
              <div className="font-medium mb-2">Selected Field Filter</div>

              <div className="text-sm text-gray-500">
                {(selectedFieldMeta.fieldtype === "Data" ||
                  !selectedFieldMeta.fieldtype) && (
                  <Input
                    value={filters[selectedFieldMeta.fieldname] || ""}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        [selectedFieldMeta.fieldname]: e.target.value,
                      }));
                    }}
                  />
                )}
                {selectedFieldMeta.fieldtype === "Link" && (
                  //   <Select
                  //     showSearch
                  //     placeholder="Search..."
                  //     options={records}
                  //     style={{ width: "200px" }}
                  //     onChange={(value) => {
                  //         setFilters((prev) => ({
                  //           ...prev,
                  //           [selectedFieldMeta.fieldname]: value,
                  //         }));
                  //     }}
                  //   />
                  <Radio.Group
                    value={filters[selectedFieldMeta.fieldname] || ""}
                    vertical
                    options={records.map((r) => ({
                      label: r.label ?? r.value,
                      value: r.value,
                    }))}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        [selectedFieldMeta.fieldname]: e.target.value,
                      }));
                    }}
                  />
                )}
                {selectedFieldMeta.fieldtype === "Select" && (
                  <Radio.Group
                    value={filters[selectedFieldMeta.fieldname] || ""}
                    vertical
                    options={options}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        [selectedFieldMeta.fieldname]: e.target.value,
                      }));
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center mt-4">
            <div className="flex items-center">
              <Button
                onClick={() => {
                  setFilters({});
                  setSearchParams({ project });
                }}
                className="ml-2"
                danger
              >
                Clear Filters
              </Button>
              <Button
                className="ml-2"
                type="primary"
                onClick={() => {
                  setSearchParams({
                    project: project,
                    ...filters,
                  });
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
