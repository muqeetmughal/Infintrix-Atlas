import { useState } from "react";
import { Modal, Form, Select, DatePicker, Button, Row, Col, message } from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { useFrappeGetDoc, useFrappePostCall } from "frappe-react-sdk";

const { Option } = Select;

export default function StartCycleModal({}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const start_cycle = searchParams.get("start_cycle") || null;
  const [form] = Form.useForm();
  const [duration, setDuration] = useState("Custom");
  
  const form_data_query = useFrappeGetDoc(
    "Cycle",
    start_cycle,
    ["form_data", "Cycle", start_cycle],
    {
      isPaused : ()=>{
        return !start_cycle
      }
    }
  );

  const mutation = useFrappePostCall("infintrix_atlas.api.v1.start_cycle");

  const handleDurationChange = (value) => {
    setDuration(value);
    const startDate = dayjs();
    let endDate;

    if (value === "1 Week") {
      endDate = startDate.add(7, "days");
    } else if (value === "2 Week") {
      endDate = startDate.add(14, "days");
    } else if (value === "3 Week") {
      endDate = startDate.add(21, "days");
    } else {
      endDate = startDate;
    }

    form.setFieldsValue({
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleFinish = (values) => {
    console.log("Form Values:", values);
    mutation.call({
        cycle_name : start_cycle,
        duration : values.duration,
        start_date: values.start_date.format("YYYY-MM-DD HH:mm:ss"),
        end_date: values.end_date.format("YYYY-MM-DD HH:mm:ss"),
      }).then((res)=>{
        message.success("Cycle Started Successfully");
        console.log("Cycle Started:", res);
        onClose();
      }).catch((err)=>{
        console.error("Error starting cycle:", err);
      })
  };

  const onClose = () => {
    searchParams.delete("start_cycle");
    setSearchParams(searchParams);
  };


  const form_data = form_data_query.data || {};
  return (
    <Modal
      open={!!start_cycle}
      title={`Start Cycle ${start_cycle}`}
      onCancel={onClose}
      footer={null}
      width={720}
      loading={form_data_query.isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          project: "Scrutin",
          duration: "Custom",
          status: "Planned",
        }}
      >
        {/* <Form.Item
          label="Project"
          name="project"
          rules={[{ required: true, message: "Project is required" }]}
        >
          <Select size="large">
            <Option value="Scrutin">Scrutin</Option>
            <Option value="Phoenix">Phoenix</Option>
          </Select>
        </Form.Item> */}

        <Form.Item label="Duration" name="duration">
          <Select size="large" onChange={handleDurationChange}>
            <Option value="1 Week">1 Week</Option>
            <Option value="2 Week">2 Week</Option>
            <Option value="3 Week">3 Week</Option>
            <Option value="Custom">Custom</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Start Date"
              name="start_date"
              rules={[{ required: true, message: "Start Date is required" }]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                placeholder="Select date"
                showTime
                disabled={duration !== "Custom"}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="End Date"
              name="end_date"
              rules={[{ required: true, message: "End Date is required" }]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                placeholder="Select date"
                showTime
                disabled={duration !== "Custom"}
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={onClose} size="large">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" size="large">
            Start Cycle
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
