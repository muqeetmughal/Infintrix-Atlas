import { FormField } from "./FormField";
import { Link } from "react-router-dom";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { useDoctypeSchema } from "../../hooks/doctype";
import { X } from "lucide-react";
import { Button, Checkbox, Collapse, Divider, Form, Input } from "antd";
import { useMemo } from "react";
import { Row, Col } from "antd";
function FormRender({
  doctype = "Task",
  open = true,
  onClose,
  full_form = true,
  defaultValues = {},
}) {
  const query = useDoctypeSchema(doctype);
  const schema = query.data || {};
  const fields = schema?.fields || [];

  const sections = useMemo(() => {
    const result = [];
    let currentSection = {
      label: "",
      columns: [[]],
    };
    let currentColumnIndex = 0;

    fields.forEach((field) => {
      // Logic for Section Break
      if (field.fieldtype === "Section Break") {
        if (
          currentSection.columns.some((col) => col.length > 0) ||
          currentSection.label
        ) {
          result.push(currentSection);
        }
        currentSection = {
          label: field.label || "",
          columns: [[]],
        };
        currentColumnIndex = 0;
      }
      // Logic for Column Break
      else if (field.fieldtype === "Column Break") {
        currentSection.columns.push([]);
        currentColumnIndex++;
      }
      // Logic for standard fields
      else if (!field.hidden) {
        currentSection.columns[currentColumnIndex].push(field);
      }
    });

    if (
      currentSection.columns.some((col) => col.length > 0) ||
      currentSection.label
    ) {
      result.push(currentSection);
    }

    return result;
  }, [fields]);

  if (query.isLoading)
    return <div className="text-center">Loading...</div>;

  const form_content = (
    <div className="bg-white w-full max-w-7xl rounded-xl shadow-2xl p-4 ">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {Object.keys(defaultValues).length ? "Edit" : "New"} {schema.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
        >
          <X size={24} />
        </button>
      </div>

      <Form
        layout="vertical"
        name={schema.name}
        initialValues={defaultValues}
        onFinish={(values) => console.log("Success:", values)}
      >
        {sections.map((section, sIdx) => {
          console.log("SECTION:", section);
          if (section.label == "") {
            return (
              <Row gutter={[32, 16]}>
                {section.columns.map((column, cIdx) => (
                  <Col
                    key={`col-${sIdx}-${cIdx}`}
                    xs={24}
                    sm={24}
                    md={Math.floor(24 / section.columns.length)}
                    lg={Math.floor(24 / section.columns.length)}
                  >
                    {column.map((field) => (
                      <FormField key={field.idx} field={field} />
                    ))}
                  </Col>
                ))}
              </Row>
            );
          }
          return (
            <Collapse
              defaultActiveKey={[]}
              bordered={false}
              key={`section-${sIdx}`}
            >
              <Collapse.Panel
                header={
                  section.label ? (
                    <span className="text-lg font-semibold text-gray-700">
                      {section.label}
                    </span>
                  ) : (
                    <Divider className="my-4" />
                  )
                }
                key={"section-" + section.label}
              >
                <Row gutter={[32, 16]}>
                  {section.columns.map((column, cIdx) => (
                    <Col
                      key={`col-${sIdx}-${cIdx}`}
                      xs={24}
                      sm={24}
                      md={Math.floor(24 / section.columns.length)}
                      lg={Math.floor(24 / section.columns.length)}
                    >
                      {column.map((field) => (
                        <FormField key={field.idx} field={field} />
                      ))}
                    </Col>
                  ))}
                </Row>
              </Collapse.Panel>
            </Collapse>
          );
        })}

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button onClick={onClose} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="bg-blue-600 px-8"
          >
            Save
          </Button>
        </div>
      </Form>
    </div>
  );

  return full_form ? (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 flex justify-center items-start">
      {form_content}
    </div>
  ) : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {form_content}
    </div>
  );
}
export default FormRender;
