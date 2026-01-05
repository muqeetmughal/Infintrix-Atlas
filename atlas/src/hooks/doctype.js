import React from 'react'
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk'
import { db } from '../lib/frappeClient'
import { set } from 'react-hook-form'

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
        if (field.fieldtype =="Select" &&attribute == "options"){
            return {...schema_query, data: {
                options: field.options.split("\n").map(opt => opt.trim()).filter(opt => opt),
                fieldtype : field.fieldtype,
                fieldname: field.fieldname,
                label : field.label
            }}
        }else{

            return {...schema_query, data: {
                [attribute]: field[attribute],
                fieldtype : field.fieldtype,
                fieldname: field.fieldname,
                label : field.label
            }}
        }
    }

    return { ...schema_query, data: field }
}  
