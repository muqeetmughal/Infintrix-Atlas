import { useQuery } from "@tanstack/react-query";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { useFrappeAuth, useFrappeGetCall, useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { db } from "../lib/frappeClient";
import { useQueryParams } from "./useQueryParams";
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

export const useTasksQuery = (
	cycle_name = undefined,
	fields = [
		"name",
		"name as id",
		"subject",
		"status",
		"type",
		"custom_cycle as cycle",
		"priority",
		"modified",
		"project",
	],
	options = {},
) => {
	const qp = useQueryParams();
	const project = qp.get("project") || null;
	// const final_filters = {
	//   ...filters,
	//   ...(cycle_name && { custom_cycle: cycle_name }),
	// };
	const filters_string = qp.all;
	const cacheKey = ["tasks", filters_string, cycle_name];

	let final_filters = [];
	if (project) {
		final_filters.push(["project", "in", [project]]);
	}
	if (cycle_name) {
		final_filters.push(["custom_cycle", "=", cycle_name]);
	}

	return useFrappeGetDocList(
		"Task",
		{
			filters: final_filters,
			fields: fields,
		},
		cacheKey,
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
			revalidateOnReconnect: false,
			...options,
		},
	);
};

export const useProjectDetailsQuery = (project) => {
	return useFrappeGetDoc("Project", project, project ? ["Project", project] : null);
};
export const useAssigneeOfTask = (selectedTask) => {
	return useFrappeGetDocList("ToDo", {
		filters: [
			["reference_type", "=", "Task"],
			["reference_name", "=", selectedTask || ""],
			["status", "=", "Open"],
		],
		fields: ["allocated_to"],
		limit_page_length: 1,
	});
}
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
	const { data: userDetails } = useFrappeGetDoc(
		"User",
		auth.currentUser,
		auth.currentUser ? ["current_user_details", auth.currentUser] : null,
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
			revalidateOnReconnect: false,
		},
	);
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

	return useFrappePostCall(
		"infintrix_atlas.api.v1.switch_assignee_of_task"
	);
}

