import { Spin } from "antd"
import { useHasRole, useUserRoles, PROJECT_MANAGER_ROLES } from "../../hooks/useRole"

export const RequireRole = ({ role, fallback = null, loading = null, children }) => {
  const { has, isLoading } = useHasRole(role)

  if (isLoading) return loading || <Spin size="small" />
  if (!has) return fallback
  return children
}

export const RoleGate = ({ roles, fallback = null, children }) => {
  const { roles: userRoles, isLoading } = useUserRoles()

  if (isLoading) return <Spin size="small" />
  const hasRole = roles.some((role) => {
    const acceptedRoles =
      role === "Projects Manager" || role === "Project Manager"
        ? PROJECT_MANAGER_ROLES
        : [role]

    return (
      userRoles.includes("Administrator") ||
      acceptedRoles.some((acceptedRole) => userRoles.includes(acceptedRole))
    )
  })
  if (!hasRole) return fallback
  return children
}
