import Badge from "@/components/ui/Badge";
import { TASK_STATUS_COLORS } from "@/data/constants";

export default function TaskTable({ tasks }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Task</th>
          <th>Status</th>
          <th>Assignee</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(t => (
          <tr key={t.id}>
            <td>{t.subject}</td>
            <td>
              <Badge className={TASK_STATUS_COLORS[t.status]}>
                {t.status}
              </Badge>
            </td>
            <td>{t.assignee}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
