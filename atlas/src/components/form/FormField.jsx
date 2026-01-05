import { Controller } from "react-hook-form";
import DateField from "./DateField";
import LinkField from "./LinkField";
import {
  Checkbox,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import { RichTextWidgetForm } from "../widgets/RichTextWidget";

export function FormField({ field }) {
  if (field.hidden) return null;

  const label = field.label || field.fieldname;
  const isReadOnly = !!field.read_only;

  const common = {
    name: field.fieldname,
    rules: field.reqd ? { required: field.label + " is Required" } : undefined,
  };
  const getFieldInput = () => {
    switch (field.fieldtype) {
      case "Data":
        return <Input type="text" placeholder={field.placeholder} />;
      case "Link":
        return <LinkField field={field} />;
      case "Color":
        return <ColorPicker />;
      case "Check":
        return <Checkbox disabled={isReadOnly}>{label}</Checkbox>;
      case "Select":
        return (
          <Select
            options={
              field.options
                ? field.options.split("\n").map((opt) => ({
                    label: opt,
                    value: opt,
                  }))
                : []
            }
            placeholder={field.placeholder}
          />
        );
      case "Int":
      case "Float":
        return (
          <InputNumber
            style={{ width: "100%" }}
            placeholder={field.placeholder}
          />
        );
      case "Date":
        return <DatePicker style={{ width: "100%" }} />;
      case "Percent":
        return (
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            max={100}
            formatter={(value) => `${value}%`}
            parser={(value) => value.replace("%", "")}
            placeholder={field.placeholder}
          />
        );
      case "Currency":
        return (
          <InputNumber
            style={{ width: "100%" }}
            formatter={(value) =>
              `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            placeholder={field.placeholder}
          />
        );
      // case "Text Editor":
      //   return <RichTextWidgetForm />;
      case "Table":
        return <Input />;

      // return (
      //   <Form.Item
      //     label={field.label}
      //     name={field.fieldname}
      //     rules={common.rules ? [common.rules] : undefined}
      //   >
      //     <Select mode="multiple" style={{ width: '100%' }} placeholder="Please select"/>
      //   </Form.Item>
      // );
      default:
        return <Input />;
      // return (
      //   <div
      //     dangerouslySetInnerHTML={{
      //       __html: `Unknown Field Type (${field.fieldtype} - ${field.fieldname})<br/>`,
      //     }}
      //   />
      // );
    }
  };

  return (
    <Form.Item
      label={field.fieldtype === "Check" ? null : label}
      name={field.fieldname}
      rules={[{ required: !!field.reqd, message: `${label} is required` }]}
      valuePropName={field.fieldtype === "Check" ? "checked" : "value"}
      className="mb-4"
      help={field.description}
    >
      {getFieldInput()}
    </Form.Item>
  );
}
