import React from "react";
import FormRender from "./form/FormRender";
import { useSearchParams } from "react-router-dom";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { Spin } from "antd";

const ModalGenerator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "create";
  const document_name = searchParams.get("docname") || null;
  const doctype = searchParams.get("doctype") || null;
  const form_data_query = useFrappeGetDoc(doctype, document_name, [
    "form_data",
    doctype,
    document_name,
  ], {
    // isPaused : ()=>{
    //   return !document_name
    // }
  });

  console.log("form_data_query",form_data_query)

  const form_data = form_data_query.data || {};

  if (!doctype || (mode === "edit" && !form_data)) {
    return null;
  }

  return (
    <>
      <FormRender
        doctype={doctype}
        open={!!doctype}
        mode={mode}
        onClose={() => {
          searchParams.delete("mode");
          searchParams.delete("docname");
          searchParams.delete("doctype");
          setSearchParams(searchParams);
        }}
        full_form={false}
        defaultValues={form_data ? form_data : {}}
      />
    </>
  );
};

export default ModalGenerator;
