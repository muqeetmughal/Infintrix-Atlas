import { Spin } from "antd"
import { useHasRole, useUserRoles } from "../../hooks/useRole"

export const RequireRole = ({ role, fallback = null, loading = null, children }) => {
  const { has, isLoading } = useHasRole(role)

  if (isLoading) return loading || <Spin size="small" />
  if (!has) return fallback
  return children
}

export const RoleGate = ({ roles, fallback = null, children }) => {
  const { roles: userRoles, isLoading } = useUserRoles()

  if (isLoading) return <Spin size="small" />
  const hasRole = roles.some((r) => userRoles.includes("Administrator") || userRoles.includes(r))
  if (!hasRole) return fallback
  return children
}
