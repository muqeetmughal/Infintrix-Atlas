import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Input,
} from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  useFrappeGetDoc,
  useFrappePostCall,
  useSWRConfig,
} from "frappe-react-sdk";
import { useQueryParams } from "../../hooks/useQueryParams";

const { Option } = Select;

const DURATION_DAYS = {
  "1 Week": 7,
  "2 Week": 14,
  "3 Week": 21,
  "4 Week": 28,
};

export default function CycleModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cycle = searchParams.get("cycle");

  const [form] = Form.useForm();
  const [duration, setDuration] = useState("Custom");

  const { mutate } = useSWRConfig();
  const qp = useQueryParams();
  const project_id = qp.get("project");

  const { data, isLoading } = useFrappeGetDoc(
    "Cycle",
    cycle,
    ["form_data", "Cycle", cycle],
    {
      isPaused: () => !cycle,
    }
  );

  const start_cycle_mutation = useFrappePostCall("infintrix_atlas.api.v1.start_cycle");

  /**
   * Sync form when data loads
   * initialValues does NOT update after first render
   */
  useEffect(() => {
    if (!data) return;

    const startDate = data.start_date
      ? dayjs(data.start_date)
      : dayjs();

    const endDate = data.end_date
      ? dayjs(data.end_date)
      : startDate;

    setDuration(data.duration || "Custom");

    form.setFieldsValue({
      ...data,
      start_date: startDate,
      end_date: endDate,
    });
  }, [data, form]);

  const handleDurationChange = (value) => {
    setDuration(value);

    if (value === "Custom") return;

    const startDate = form.getFieldValue("start_date") || dayjs();
    const days = DURATION_DAYS[value];

    form.setFieldsValue({
      start_date: startDate,
      end_date: startDate.add(days, "days"),
    });
  };

  const handleStartDateChange = (date) => {
    if (!date || duration === "Custom") return;

    const days = DURATION_DAYS[duration];
    form.setFieldsValue({
      end_date: date.add(days, "days"),
    });
  };

  const handleFinish = (values) => {
    start_cycle_mutation
      .call({
        name: cycle,
        cycle_name: values.cycle_name,
        duration: values.duration,
        start_date: values.start_date.format("YYYY-MM-DD HH:mm:ss"),
        end_date: values.end_date.format("YYYY-MM-DD HH:mm:ss"),
      })
      .then(() => {
        message.success("Cycle Started Successfully");
        onClose();
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to start cycle");
      });
  };

  const onClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("cycle");
    params.delete("mode");
    setSearchParams(params);

    mutate(["cycles"]);
    mutate(["tasks", project_id]);
  };

  return (
    <Modal
      open={!!cycle}
      title={`Start Cycle ${cycle}`}
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
        <Form.Item
          label="Cycle Name"
          name="cycle_name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Duration"
          name="duration"
          rules={[{ required: true }]}
        >
          <Select size="large" onChange={handleDurationChange}>
            <Option value="1 Week">1 Week</Option>
            <Option value="2 Week">2 Week</Option>
            <Option value="3 Week">3 Week</Option>
            <Option value="4 Week">4 Week</Option>
            <Option value="Custom">Custom</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Start Date"
              name="start_date"
              rules={[{ required: true }]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                showTime
                onChange={handleStartDateChange}
                format="ddd, MMM DD, YYYY, h:mm A"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="End Date"
              name="end_date"
              rules={[{ required: true }]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                showTime
                format="ddd, MMM DD, YYYY, h:mm A"
                disabled={duration !== "Custom"}
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button size="large" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" size="large" htmlType="submit">
            Start Cycle
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
