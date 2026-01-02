import { useFrappeGetDocList } from 'frappe-react-sdk'
import React, { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import {useDoctypeSchema} from '../../hooks/doctype'

const LinkField = ({
    control,
    field,
    common
}) => {
    const doctype = field.options

    const [searchTerm, setSearchTerm] = React.useState('')
    const [isOpen, setIsOpen] = React.useState(false)

    const doctype_schema_query = useDoctypeSchema(doctype);
    const title_field = useMemo(() => doctype_schema_query.data?.title_field || "name", [doctype_schema_query.data]);



    const doc_query = useFrappeGetDocList(doctype, {
        orFilters: searchTerm ? [
            [title_field, "like", `%${searchTerm}%`],
            
        ] : [],
        limit_page_length: 50,
        fields: ["name", title_field],
    
    })
    const dropdownRef = React.useRef(null)

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const options = useMemo(() => {
        return doc_query.data ? doc_query.data : []
    }, [doc_query.data])


    if (doctype_schema_query.isLoading) return <div>Loading...</div>;



    // const filteredOptions = options.filter(opt =>
    //     opt.toLowerCase().includes(searchTerm.toLowerCase())
    // )

    return (
        <div className="relative" ref={dropdownRef}>
            <Controller
                {...common}
                control={control}
                render={({ field: f }) => (
                    <>
                        <input
                            type="text"
                            value={isOpen ? searchTerm : f.value || ''}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setIsOpen(true)
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder="Search..."
                            className="peer w-full px-4 py-4 border border-gray-300 rounded-md outline-none bg-white transition-all"
                        />
                        {isOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {options.length > 0 ? (
                                    options.map(opt => (
                                        <div
                                            key={opt.name}
                                            onClick={() => {
                                                f.onChange(opt.name)
                                                setSearchTerm('')
                                                setIsOpen(false)
                                            }}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                        >
                                            {opt[title_field]} <small>({opt['name']})</small>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-gray-500">No options found</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            />
            <label
                htmlFor={field.fieldname}
                className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:left-3 pointer-events-none"
            >
                {field.label}
            </label>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    )
}

export default LinkField