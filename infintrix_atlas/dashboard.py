def get_project_dashboard_data(data):
	data.transactions.append({
		"label": "Atlas",
		"items": [
			"Cycle",
			"Requirement",
			"Scope Snapshot",
			"Project Resource",
			"Project Action Request",
			"Change Request",
			"AI Task Session",
			"AI Task Draft",
		],
	})
	return data
