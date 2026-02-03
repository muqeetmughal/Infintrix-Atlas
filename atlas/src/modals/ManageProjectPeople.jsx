import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import { Modal, Form, Button } from "antd";
import { useFrappePostCall } from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";
import { useProjectUsers } from "../hooks/query";

const ManageProjectPeople = () => {
  const [form] = Form.useForm();
  const qp = useQueryParams();
  const project = qp.get("project") || null;
  const open = qp.get("manage_project_people") === "1";

  const users_project_query = useProjectUsers(project);

  const updateMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.update_users_on_project",
  );

  const users = users_project_query?.data?.message || [];


  const onClose = () => {
    qp.clear("manage_project_people");
    users_project_query.mutate();
  };

  const handleSubmit = (values) => {
    console.log("Form submitted with people: ", values);
    // Add your effect/logic here
    updateMutation
      .call({
        project: project, // You can replace this with a prop or state variable
        users: values.users,
      })
      .then(() => {
        onClose();
      });
  };

  if (users_project_query.isLoading) {
    return null;
  }

  return (
    <Modal
      title="Manage Project People"
      open={open}
      onCancel={() => {
        onClose();
      }}
      footer={null}
    >
      {users_project_query.isLoading ? (
        <div>Loading...</div>
      ) : (
        <Form
          initialValues={{
            users: users,
          }}
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="users"
            label="Select People"
            rules={[{ required: true, message: "Please select people" }]}
          >
            <AssigneeSelectWidget style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button
              loading={updateMutation.loading}
              type="primary"
              htmlType="submit"
            >
              Confirm
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ManageProjectPeople;
