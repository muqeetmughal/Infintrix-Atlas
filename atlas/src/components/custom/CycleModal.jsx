import { useEffect, useMemo, useState } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const qp = useQueryParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [duration, setDuration] = useState("Custom");

  const { mutate } = useSWRConfig();
  const project_id = qp.get("project");
  const cycle = qp.get("cycle");

  const { data, isLoading } = useFrappeGetDoc(
    "Cycle",
    cycle,
   cycle ? ["Cycle", cycle] : null,
    {
      // isPaused: () => {

      //   console.log("Query Paused because cycle is null:", !cycle);
      //   return !cycle
      // },

      // Don't use a function for isPaused if it's acting up;
      // passing null as the key (above) is the standard SWR way to pause.
      revalidateOnMount: true,
      revalidateOnFocus: false, // Turn this off to stop the "window focus" dependency

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
  }, [data, form, cycle]);
  // const formInitialValues = useMemo(() => {
  //     if (!data) return {};

  //     const startDate = data.start_date
  //       ? dayjs(data.start_date)
  //       : dayjs();

  //     const endDate = data.end_date
  //       ? dayjs(data.end_date)
  //       : startDate;

  //     return {
  //       ...data,
  //       start_date: startDate,
  //       end_date: endDate,
  //     };
  //   }, [data, isLoading]);
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
        navigate(`/tasks/kanban?project=${project_id}`);
        onClose();
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to start cycle");
      });
  };

  const onClose = () => {
    searchParams.delete("cycle");
    searchParams.delete("mode");
    setSearchParams(searchParams);
    mutate(["cycles", project_id]);
    mutate(["tasks", project_id]);

  };
  // if (!cycle) return null;

  return (
    <Modal
      open={!!cycle}
      title={`Start Cycle ${data?.cycle_name ? `: ${data.cycle_name}` : cycle}`}
      onCancel={onClose}
      footer={null}
      width={720}
      confirmLoading={isLoading}
      // destroyOnClose
      // forceRender
    >
      {/* Loading: {isLoading ? "Yes" : "No"}<br/>
      data: {JSON.stringify(formInitialValues, null, 2)}<br/> */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      // initialValues={formInitialValues}
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
