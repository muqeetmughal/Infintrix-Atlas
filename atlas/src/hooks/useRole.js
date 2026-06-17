import { useFrappeGetCall } from "frappe-react-sdk"

export const PROJECT_MANAGER_ROLES = ["Projects Manager", "Project Manager"]

const getBootRoles = () => {
  if (typeof window === "undefined") {
    return []
  }

  const bootRoles =
    window.frappe?.boot?.user?.roles ||
    window.frappe?.boot?.user_roles ||
    window.frappe?.user_roles

  return Array.isArray(bootRoles) ? bootRoles : []
}

const expandRoleAliases = (role) => {
  if (Array.isArray(role)) {
    return role.flatMap(expandRoleAliases)
  }

  if (role === "Projects Manager" || role === "Project Manager") {
    return PROJECT_MANAGER_ROLES
  }

  return [role]
}

export const useUserRoles = () => {
  const bootRoles = getBootRoles()
  const hasBootRoles = bootRoles.length > 0

  const { data, isLoading, error } = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_user_roles",
    undefined,
    hasBootRoles ? null : "user_roles",
  )

  return {
    roles: hasBootRoles ? bootRoles : data?.message || [],
    isLoading: hasBootRoles ? false : isLoading,
    error,
  }
}

export const useHasRole = (role) => {
  const { roles, isLoading } = useUserRoles()
  const acceptedRoles = expandRoleAliases(role)
  const has =
    roles.includes("Administrator") ||
    acceptedRoles.some((acceptedRole) => roles.includes(acceptedRole))
  return { has, isLoading }
}
