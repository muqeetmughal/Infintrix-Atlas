import { useQuery } from "@tanstack/react-query";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { db } from "../lib/frappeClient";
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

export const useListQuery = (doctype, filters, fields,options) => {

  return useQuery({
    queryKey: ["tasks"],
    queryFn: () =>
      db.getDocList(doctype, {
        filters: filters,
        fields: fields,
      }),
    ...options,
  });
}