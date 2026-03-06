import { useQuery } from "@tanstack/react-query";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import {
	useFrappeAuth,
	useFrappeGetCall,
	useFrappeGetDoc,
	useFrappeGetDocList,
	useFrappePostCall,
} from "frappe-react-sdk";
import { db } from "../lib/frappeClient";
import { useQueryParams } from "./useQueryParams";
import { useState, useCallback, use, useEffect } from "react"

export const useAvatarQuery = (name) => {
	return useQuery({
		queryKey: ["avatar", name],
		queryFn: async () => {
			const avatarDataUri = await createAvatar(initials, {
				seed: name,
				radius: 50,
				backgroundColor: [
					"00897b",
					"00acc1",
					"039be5",
					"1e88e5",
					"3949ab",
					"43a047",
					"5e35b1",
					"7cb342",
					"8e24aa",
					"c0aede",
					"b6e3f4",
					"c0ca33",
					"d1d4f9",
					"d81b60",
					"e53935",
					"f4511e",
					"fb8c00",
					"fdd835",
					"ffb300",
					"ffd5dc",
					"ffdfbf",
				],
			}).toDataUri();
			return avatarDataUri;
		},
		enabled: !!name,
	});
};

export const useListQuery = (doctype, filters, fields, options) => {
	return useQuery({
		queryKey: ["tasks"],
		queryFn: () =>
			db.getDocList(doctype, {
				filters: filters,
				fields: fields,
			}),
		...options,
	});
};
export const useTasksQuery = (project, group_by = null, filters = {}) => {
	const query = useFrappeGetCall(
		"infintrix_atlas.api.v1.list_tasks",
		{ project: project, group_by: group_by, filters: filters },
		project ? ["tasks", project, group_by, filters] : null,
		{},
	);
	return query;
};
// export const useTasksQuery = (
// 	cycle_name = undefined,
// 	fields = [
// 		"name",
// 		"name as id",
// 		"subject",
// 		"status",
// 		"type",
// 		"custom_cycle as cycle",
// 		"custom_sort_order",
// 		"priority",
// 		"modified",
// 		"project",
// 	],
// 	options = {},
// ) => {
// 	const qp = useQueryParams();
// 	const project = qp.get("project") || null;

// 	const filters_string = qp.all;
// 	const cacheKey = ["tasks", filters_string, cycle_name];

// 	let final_filters = [];
// 	if (project) {
// 		final_filters.push(["project", "in", [project]]);
// 	}
// 	if (cycle_name) {
// 		final_filters.push(["custom_cycle", "=", cycle_name]);
// 	}

// 	// final_filters.push(["parent_task", "=", null]);
// console.log("Final filters for tasks query:", final_filters);
// 	return useFrappeGetDocList(
// 		"Task",
// 		{
// 			filters: final_filters,
// 			fields: fields,
// 			orderBy: {
// 				field: "modified",
// 				order: "desc",
// 			},
// 			limit_start: 0,
// 			limit: 99999,
// 		},
// 		cacheKey,
// 		{
// 			// revalidateOnFocus: false,
// 			// revalidateIfStale: false,
// 			// revalidateOnReconnect: false,
// 			...options,
// 		},
// 	);
// };

export const useProjectDetailsQuery = (project) => {
	return useFrappeGetDoc("Project", project, project ? ["Project", project] : null);
};
export const useAssigneeOfTask = (task_name) => {
	return useFrappeGetCall(
		"infintrix_atlas.api.v1.get_assignee_of_task",
		{ task_name: task_name },
		task_name ? ["assignee_of_task", task_name] : null,
	);
};
// 	return useFrappeGetDocList(
// 		"ToDo",
// 		{
// 			filters: [
// 				["reference_type", "=", "Task"],
// 				["reference_name", "=", selectedTask || ""],
// 				["status", "=", "Open"],
// 			],
// 			fields: ["allocated_to"],
// 			limit: 1,
// 			orderBy: {
// 				field: "modified",
// 				order: "desc",
// 			},
// 		},
// 		selectedTask ? ["assignee_of_task", selectedTask] : null,
// 		{
// 			revalidateOnFocus: false,
// 			revalidateIfStale: false,
// 			revalidateOnReconnect: false,
// 		},
// 	);
// };
// export const useTasksQuery = (filters, options) => {
//   return  useFrappeGetDocList(
//       `Task`,
//       {
//         filters: isScrum
//           ? { project: project, custom_cycle: cycle_name }
//           : { project: project },
//         fields: [
//           "name",
//           "name as id",
//           "subject as title",
//           "status",
//           "type",
//           "custom_cycle as cycle",
//           "priority",
//           "modified",
//           "project",
//         ],
//         // limit_page_length: 1000,
//       },
//       isScrum ? `task_list_${project}_${cycle_name}` :`task_list_${project}`, {
//           revalidateOnFocus: false,
//           revalidateIfStale: false,
//           revalidateOnReconnect: false,
//       }

//     );
// };
export const useAuth = () => {
	const auth = useFrappeAuth();
	const userDoc = useFrappeGetDoc(
		"User",
		auth.currentUser,
		auth.currentUser ? ["current_user_details", auth.currentUser] : null,
		// {
		// 	revalidateOnFocus: false,
		// 	revalidateIfStale: false,
		// 	revalidateOnReconnect: false,
		// },
	);
	const userDetails = userDoc?.data || {};
	return {
		user: userDetails,
		...auth,
	};
};
export const useProjectUsers = (project) => {
	return useFrappeGetCall(
		"infintrix_atlas.api.v1.users_on_project",
		{
			project: project, // You can replace this with a prop or state variable
		},
		project ? ["users_on_project", project] : null,
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
		},
	);
};
export const useAssigneeUpdateMutation = () => {
	return useFrappePostCall("infintrix_atlas.api.v1.switch_assignee_of_task");
};

export const useSendAttachmentNotificationMutation = () => {
	return useFrappePostCall("infintrix_atlas.api.v1.notify_attachment_added");
};

// export const useTasksQuery = (project, group_by = null, filters = {}) => {
// 	const query = useFrappeGetCall(
// 		"infintrix_atlas.api.v1.list_tasks",
// 		{ project: project, group_by: group_by, filters: filters },
// 		project ? ["tasks", project, group_by, filters] : null,
// 		{},
// 	);
// 	return query;
// };


export function useFrappePaginatedTasksCall(method, baseParams = {}, pageSize = 20, autoLoad = true) {
  const { call } = useFrappePostCall(method)

  const [data, setData] = useState([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)




  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)

    try {
      const res = await call({
        ...baseParams,
        limit: pageSize,
        offset: offset
      })

      const rows = res?.message || []

      setData(prev => {
        const map = new Map(prev.map(i => [i.name, i]))
        rows.forEach(r => map.set(r.name, r))
        return Array.from(map.values())
      })

      setOffset(prev => prev + rows.length)

      if (rows.length < pageSize) {
        setHasMore(false)
      }

      return rows
    } finally {
      setLoading(false)
    }
  }, [call, baseParams, offset, loading, hasMore, pageSize])

  const reset = useCallback(() => {
    setData([])
    setOffset(0)
    setHasMore(true)
  }, [])


const hasLoadedRef = useCallback(() => {
	if (autoLoad && data.length === 0 && !hasLoadedRef.current) {
		hasLoadedRef.current = true
		loadMore()
	}
}, [autoLoad, data.length, loadMore])

useEffect(() => {
	hasLoadedRef()
}, [hasLoadedRef])

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset
  }
}

export function useFrappeManualPaginatedCall(method, baseParams = {},page, pageSize = 20) {

	  const { call } = useFrappePostCall(method)
	  const [data, setData] = useState([])
	  const [loading, setLoading] = useState(false)

	  const loadPage = useCallback(async (page) => {
	    setLoading(true)

	    try {
	      const res = await call({
	        ...baseParams,
	        limit: pageSize,
	        offset: (page - 1) * pageSize
	      })

	      const rows = res?.message || []
	      setData(rows)
	      return rows
	    } finally {
	      setLoading(false)
	    }
	  }, [call, baseParams, pageSize])

	  useEffect(() => {
	    loadPage(page)
	  }, [loadPage, page])

	  return {
	    data,
	    loading,
	    loadPage
	  }
	}

export const useTaskDetailsQuery = (task_name) => {
	return useFrappeGetDoc(
		"Task",
		task_name,
		task_name ? ["Task", task_name] : null,
		// {
		//   // refreshInterval: 5000, // Auto-refresh every 5 seconds
		//   refreshWhenHidden: false, // Don't refresh when the modal is hidden
		//   refreshWhenOffline: false, // Don't refresh when offline
		//   revalidateIfStale: true, // Revalidate if data is stale
		//   revalidateOnFocus: false, // Don't revalidate on window focus
		//   revalidateOnReconnect: true, // Revalidate when the connection is back
		// },
	  );
};