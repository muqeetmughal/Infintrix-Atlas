import React from 'react'
import FormRender from './form/FormRender';

const ModalGenerator = () => {

    const [searchParams, setSearchParams] = React.useState(new URLSearchParams());
    const modal_type = searchParams.get("modal_type") || null;
    const document_name = searchParams.get("docname") || null;
    const doctype = searchParams.get("doctype") || null;

    return (
        <div>
            {/* <FormRender
                doctype={doctype}
                open={false}
                onClose={() => {
                    searchParams.delete("modal_type");
                    searchParams.delete("docname");
                    searchParams.delete("doctype");
                    setSearchParams(searchParams);
                }}
                full_form={false}
                defaultValues={document_name ? { name: document_name } : {}}
            /> */}
        </div>
    )
}

export default ModalGenerator