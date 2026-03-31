import React from "react";
import { useFrappePaginatedTasksCall } from "../hooks/query";

const TestView = () => {
  const query = useFrappePaginatedTasksCall(
    "infintrix_atlas.api.v1.list_tasks",
    { project: "PROJ-0001" },
    5,
    false
  );
  return (
    <div>
      <button
        onClick={query.loadMore}
        disabled={query.loading || !query.hasMore}
      >
        {query.loading
          ? "Loading..."
          : query.hasMore
            ? "Load More"
            : "No More Tasks"}
      </button>
      <ul>
        {query.data.map((task) => (
          <li key={task.name}> {task.name} {" | \t"} {task.subject}</li>
        ))}
      </ul>
    </div>
  );
};

export default TestView;
