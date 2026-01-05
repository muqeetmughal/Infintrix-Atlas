import React from "react";
import { FormField } from "./FormField";
import { Link } from "react-router-dom";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Maximize, Minimize, X } from "lucide-react";
import { Button, Checkbox, Collapse, Divider, Form, Input, Modal } from "antd";
import { useMemo } from "react";
import { Row, Col } from "antd";
function FormRender({
  doctype = "Task",
  open = true,
  onClose,
  full_form = true,
  defaultValues = {},
}) {

  const [form] = Form.useForm();
  const [quickEntry, setQuickEntry] = React.useState(true);
  const query = useDoctypeSchema(doctype);
  const createMutation = useFrappeCreateDoc();
  const schema = query.data || {};

  // console.log("Schema:", schema.fields.map(f => {
  //   return {fieldname: f.fieldname, fieldtype: f.fieldtype, allow_in_quick_entry: f.allow_in_quick_entry}
  // }));



  const fields = useMemo(() => {
    const fields = schema?.fields || [];
    if (quickEntry) {
      return fields.filter(f => f.allow_in_quick_entry == 1);
    }
    return fields;
  }, [quickEntry, query.data]);


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

  // if (query.isLoading)
  //   return <div className="text-center">Loading...</div>;


  return (<Modal
    title={`New ${doctype}`}
    closable={{ 'aria-label': 'Custom Close Button' }}
    open={open}
    onOk={() => { }}
    width={800}
    onCancel={onClose}
    loading={query.isLoading}
    footer={[
      <Button
        type="text"
        icon={quickEntry ? <Maximize size={16} /> : <Minimize size={16} />}
        onClick={() => setQuickEntry(!quickEntry)}
      ></Button>,
      <Button onClick={onClose} size="large">
        Cancel
      </Button>,
      <Button
        type="primary"
        size="large"
        className="bg-blue-600 px-8"
        onClick={() => {
          form.submit()
        }}
      >
        Save
      </Button>]
    }


  >
    <Form
      form={form}
      variant="underlined"
      layout="vertical"
      name={schema.name}
      initialValues={defaultValues}
      onFinish={(values) => {
        console.log("Success:", values)
        createMutation.createDoc(doctype, values).then(res => {
          console.log("Created:", res);
          onClose();
        })
      }}
    >
      {sections.map((section, sIdx) => {
        // console.log("SECTION:", section);
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
                  {console.log("COLUMN:", column)}
                  {column.map((field) => (
                    <FormField key={field.fieldname} field={field} />
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
                      <FormField key={field.fieldname} field={field} />
                    ))}
                  </Col>
                ))}
              </Row>
            </Collapse.Panel>
          </Collapse>
        );
      })}

      {/* <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
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
        </div> */}
    </Form>
  </Modal>)

  // if (open && !full_form) {
  //   return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  //     {form_content}
  //   </div>

  // } else {
  //   return <div className="min-h-screen bg-gray-100 p-4 md:p-10 flex justify-center items-start">
  //     {form_content}
  //   </div>

  // }

}
export default FormRender;
