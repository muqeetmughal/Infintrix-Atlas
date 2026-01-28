import { useState, useMemo } from "react";
import { Modal, Form, Select, Button, message, Spin } from "antd";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useFrappeGetDocList,
  useFrappePostCall,
  useSWRConfig,
} from "frappe-react-sdk";
import { useQueryParams } from "../../hooks/useQueryParams";
import Confetti from "../Confetti";

export default function CompleteCycleModal() {

    const [showCelebration, setShowCelebration] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const complete_cycle = searchParams.get("complete_cycle");
  const [move_tasks_to, setMoveTasksTo] = useState(null);
  const [form] = Form.useForm();
  const { mutate } = useSWRConfig();
  const qp = useQueryParams();
  const project_id = qp.get("project") || null;
  // ------------------------
  // NEVER let SWR see null keys
  // ------------------------
  const tasks_key = complete_cycle ? ["cycle-tasks", complete_cycle] : null;

  const planned_cycles_key = complete_cycle
    ? ["planned-cycles", complete_cycle]
    : null;

  const tasks_query = useFrappeGetDocList(
    "Task",
    {
      filters: [["custom_cycle", "=", complete_cycle]],
      fields: ["status", "name"],
      limit_page_length: 1000,
    },
    tasks_key
  );

  const planned_cycles_query = useFrappeGetDocList(
    "Cycle",
    {
      filters: [
        ["status", "=", "Planned"],
        ["project", "=", project_id],
        ["name", "!=", complete_cycle],
      ],
      fields: ["name as value", "cycle_name as label"],
      limit_page_length: 100,
    },
    planned_cycles_key
  );

  const tasks = tasks_query.data;

  // SWR-correct readiness: data exists OR not loaded yet
  const isTasksReady = Array.isArray(tasks) && !tasks_query.isLoading;

  const open_tasks = useMemo(() => {
    if (!isTasksReady) return [];
    return tasks.filter((t) => t.status !== "Completed");
  }, [isTasksReady, tasks]);

  const completed_tasks = useMemo(() => {
    if (!isTasksReady) return [];
    return tasks.filter((t) => t.status === "Completed");
  }, [isTasksReady, tasks]);

  const mutation = useFrappePostCall("infintrix_atlas.api.v1.complete_cycle");

  const onClose = () => {
    searchParams.delete("complete_cycle");
    setSearchParams(searchParams);
    mutate(["cycles", project_id]);
    mutate(["tasks", project_id]);
  };

  const handleFinish = () => {
    mutation
      .call({
        name: complete_cycle,
        move_tasks_to,
      })
      .then(() => {
        message.success("Cycle completed");
        onClose();
        setShowCelebration(true);
        navigate(`/tasks/backlog?project=${project_id}`);
      })
      .catch(() => {
        message.error("Failed to complete cycle");
      });
  };

  const isLoading =
    !complete_cycle || tasks_query.isLoading || planned_cycles_query.isLoading;

  return (

    <>
    <Modal open={!!complete_cycle} onCancel={onClose} footer={null} width={720}>
      {isLoading ? (
        <div className="p-8 text-center">
          <Spin />
        </div>
      ) : (
        <>
          <div className="px-8 pt-6 pb-2">
            <h2 className="text-2xl font-bold mb-6">
              Complete {complete_cycle}
            </h2>

            {!isTasksReady ? (
              <div className="py-6 text-center">
                <Spin />
              </div>
            ) : open_tasks.length > 0 ? (
              <>
                <p className="text-[15px] mb-4">
                  This sprint contains <b>{completed_tasks.length}</b> completed
                  work items and <b>{open_tasks.length}</b> open work items.
                </p>

                <div className="pt-4 space-y-2">
                  <label className="block text-sm font-bold">
                    Move open work items to
                  </label>
                  <Select
                    style={{ width: "100%" }}
                    options={planned_cycles_query.data || []}
                    value={move_tasks_to}
                    onChange={setMoveTasksTo}
                    placeholder="Select Cycle"
                  />
                </div>
              </>
            ) : (
              <p className="text-[15px]">
                This sprint contains {completed_tasks.length} completed work
                items. That’s all of them — well done!
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 px-8 py-4">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              disabled={open_tasks.length > 0 && !move_tasks_to}
              onClick={handleFinish}
            >
              Complete Cycle
            </Button>
          </div>


        </>
      )}
    </Modal>
          <Confetti
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
