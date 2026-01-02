import { useFrappeGetCall } from 'frappe-react-sdk'

export const useDoctypeSchema = (doctype) => {

    const query = useFrappeGetCall("infintrix_atlas.api.v1.get_doctype_meta", {
        doctype_name: doctype
    })

    const schema = query.data?.message || {}
    return {
        ...query,
        data : schema,
    }
}

export const useGetDoctypeField = (doctype, fieldname, attribute=null) => {
    const schema_query = useDoctypeSchema(doctype)

    const field = (schema_query.data?.fields||[])?.find(f => f.fieldname === fieldname) || null

    if (attribute && field) {
        if (attribute == "options"){
            return {...schema_query, data: field[attribute]?.split('\n') || []}
        }else{

            return {...schema_query, data: field[attribute]}
        }
    }

    return { ...schema_query, data: field }
}   