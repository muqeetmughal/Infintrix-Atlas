// lib/frappeClient.ts
import { FrappeApp } from 'frappe-js-sdk'

export const frappe = new FrappeApp({
  url: import.meta.env.VITE_FRAPPE_URL,
//   token: import.meta.env.VITE_FRAPPE_TOKEN,
  socketPort: import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined

})

export const db = frappe.db
export const call = frappe.call
