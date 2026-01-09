import React, { useMemo, useState, useEffect } from "react";
import { FormField } from "./FormField";
import { useFrappeCreateDoc } from "frappe-react-sdk";
import { useDoctypeSchema } from "../../hooks/doctype";
import { Maximize, Minimize } from "lucide-react";
import { Button, Collapse, Form, Modal, Row, Col } from "antd";
import dayjs from "dayjs";
function FormRender({
  doctype = null,
  mode = "create",
  open = true,
  onClose,
  defaultValues = {},
}) {
  console.log("FormRender defaultValues:", defaultValues);
  const [form] = Form.useForm();

  // Quick Entry is only valid outside create mode
  const [quickEntry, setQuickEntry] = useState(mode !== "create");

  const schemaQuery = useDoctypeSchema(doctype);
  const createMutation = useFrappeCreateDoc();

  const schema = schemaQuery.data || {};
  const allFields = schema.fields || [];

  /**
   * Inject edit data when it arrives (AntD ignores initialValues after mount)
   */
  useEffect(() => {
    if (!defaultValues || Object.keys(defaultValues).length === 0) return;

    (async () => {


      const isTimestampString = (v) =>
        typeof v === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v);

      const convert = (val) => {
        if (isTimestampString(val)) {
          return dayjs(val, "YYYY-MM-DD HH:mm:ss");
        }
        if (Array.isArray(val)) return val.map(convert);
        if (val && typeof val === "object") {
          const out = {};
          Object.keys(val).forEach((k) => {
            out[k] = convert(val[k]);
          });
          return out;
        }
        return val;
      };

      form.resetFields(); // wipe old record
      form.setFieldsValue(convert(defaultValues)); // inject converted record
    })();
  }, [defaultValues, form]);

  /**
   * Never allow empty form (Quick Entry fallback)
   */
  const fields = useMemo(() => {
    if (!quickEntry) return allFields;

    const quick = allFields.filter(f => f.allow_in_quick_entry == 1);
    return quick.length ? quick : allFields;
  }, [quickEntry, allFields]);

  /**
   * Build layout
   */
  const sections = useMemo(() => {
    const result = [];
    let current = { label: "", columns: [[]] };
    let col = 0;

    fields.forEach(field => {
      if (field.fieldtype === "Section Break") {
        if (current.columns.some(c => c.length) || current.label) {
          result.push(current);
        }
        current = { label: field.label || "", columns: [[]] };
        col = 0;
        return;
      }

      if (field.fieldtype === "Column Break") {
        current.columns.push([]);
        col++;
        return;
      }

      if (!field.hidden) {
        current.columns[col].push(field);
      }
    });

    if (current.columns.some(c => c.length) || current.label) {
      result.push(current);
    }

    return result;
  }, [fields]);

  return (
    <Modal
      title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} ${doctype}`}
      open={open}
      width={800}
      onCancel={onClose}
      confirmLoading={schemaQuery.isLoading}
      footer={[
        <Button
          key="toggle"
          type="text"
          icon={quickEntry ? <Maximize size={16} /> : <Minimize size={16} />}
          onClick={() => setQuickEntry(v => !v)}
        />,
        <Button key="cancel" onClick={onClose} size="large">
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          size="large"
          className="bg-blue-600 px-8"
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name={schema.name}
        initialValues={defaultValues}   // used only on first mount
        onFinish={(values) => {
          createMutation.createDoc(doctype, values).then(onClose);
        }}
      >
        {sections.map((section, sIdx) => {
          const grid = (
            <Row gutter={[32, 16]}>
              {section.columns.map((column, cIdx) => (
                <Col
                  key={`${sIdx}-${cIdx}`}
                  xs={24}
                  md={Math.floor(24 / section.columns.length)}
                >
                  {column.map(field => {

                    
                    return (
                      <>
                      {/* {field.fieldtype} */}
                      <FormField key={field.fieldname} field={field} />
                      </>
                    )
                  })}
                </Col>
              ))}
            </Row>
          );

          if (!section.label) return <div key={sIdx}>{grid}</div>;

          return (
            <Collapse key={sIdx} bordered={false} defaultActiveKey={[section.label]}>
              <Collapse.Panel
                key={section.label}
                header={<span className="text-lg font-semibold text-gray-700">{section.label}</span>}
              >
                {grid}
              </Collapse.Panel>
            </Collapse>
          );
        })}
      </Form>
    </Modal>
  );
}

export default FormRender;
