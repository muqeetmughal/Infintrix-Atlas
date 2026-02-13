import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";


const InvitedUserModal = ({ visible, onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email) {
      message.warning("Please enter an email address");
      return;
    }
    setSent(true);
    message.success("Email sent");
  };

  const handleCancel = () => {
    setEmail("");
    setSent(false);
    onClose();
  };

  return (
    <Modal
      title="Invite User"
      open={visible}
      onCancel={handleCancel}
      footer={null}
    >
      <div className="space-y-4">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          disabled={sent}
        />
        <Button type="primary" onClick={handleSend} disabled={sent} block>
          Send Email
        </Button>
        {sent && (
          <p className="text-green-600">Email sent successfully.</p>
        )}
      </div>
    </Modal>
  );
};

export default InvitedUserModal;
