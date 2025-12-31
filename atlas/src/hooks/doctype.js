import { useFrappeGetCall } from 'frappe-react-sdk'

const useDoctypeSchema = (doctype) => {

    const query = useFrappeGetCall("infintrix_atlas.api.v1.get_doctype_meta", {
        doctype_name: doctype
    })

    const schema = query.data?.message || {}
    return {
        ...query,
        data : schema,
    }
}

export default useDoctypeSchema