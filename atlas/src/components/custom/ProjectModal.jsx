import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
} from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";

export default function ProjectModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const { mutate } = useSWRConfig();

  const projectParam = searchParams.get("project_modal");
  const isCreate = projectParam === "create";
  const projectName = isCreate ? null : projectParam;

  const { data, isLoading } = useFrappeGetDoc(
    "Project",
    projectName,
    projectName ? ["Project", projectName] : null,
    { revalidateOnFocus: false }
  );

  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      ...data,
      expected_start_date: data.expected_start_date
        ? dayjs(data.expected_start_date)
        : null,
      expected_end_date: data.expected_end_date
        ? dayjs(data.expected_end_date)
        : null,
    });
  }, [data, form]);

  const onClose = () => {
    searchParams.delete("project_modal");
    setSearchParams(searchParams);
    form.resetFields();
    mutate((key) => Array.isArray(key) && key.some((k) => k === "Project"));
    mutate((key) => Array.isArray(key) && key.some((k) => k === "tasks"));
  };

  const handleFinish = async (values) => {
    const payload = {
      ...values,
      expected_start_date: values.expected_start_date
        ? values.expected_start_date.format("YYYY-MM-DD")
        : null,
      expected_end_date: values.expected_end_date
        ? values.expected_end_date.format("YYYY-MM-DD")
        : null,
    };

    try {
      if (isCreate) {
        await createMutation.createDoc("Project", payload);
        message.success("Project created successfully");
      } else {
        await updateMutation.updateDoc("Project", projectName, payload);
        message.success("Project updated successfully");
      }
      onClose();
    } catch (err) {
      message.error(err.message || "Failed to save project");
    }
  };

  return (
    <Modal
      open={!!projectParam}
      title={isCreate ? "New Project" : "Edit Project"}
      onCancel={onClose}
      footer={null}
      width={720}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Project Name"
              name="project_name"
              rules={[{ required: true, message: "Project name is required" }]}
            >
              <Input size="large" placeholder="Enter project name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true }]}
            >
              <Select size="large">
                <Select.Option value="Open">Open</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Execution Mode" name="custom_execution_mode">
              <Select size="large" placeholder="Select mode">
                <Select.Option value="Kanban">Kanban</Select.Option>
                <Select.Option value="Scrum">Scrum</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Project Type" name="project_type">
              <Input size="large" placeholder="e.g. Development, Design" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Start Date" name="expected_start_date">
              <DatePicker size="large" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="End Date" name="expected_end_date">
              <DatePicker size="large" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Priority" name="priority">
              <Select size="large">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Urgent">Urgent</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Department" name="department">
              <Input size="large" placeholder="Department name" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button size="large" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={createMutation.isLoading || updateMutation.isLoading}
          >
            {isCreate ? "Create Project" : "Save Changes"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
