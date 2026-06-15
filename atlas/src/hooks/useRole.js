import { useFrappeGetCall } from "frappe-react-sdk"

export const useUserRoles = () => {
  const { data, isLoading, error } = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_user_roles",
    undefined,
    "user_roles",
  )
  return {
    roles: data?.message || [],
    isLoading,
    error,
  }
}

export const useHasRole = (role) => {
  const { roles, isLoading } = useUserRoles()
  const has = roles.includes("Administrator") || roles.includes(role)
  return { has, isLoading }
}
