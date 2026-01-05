import React from "react";
import FormRender from "./form/FormRender";
import { useSearchParams } from "react-router-dom";

const ModalGenerator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "create";
  const document_name = searchParams.get("docname") || null;
  const doctype = searchParams.get("doctype") || null;

  if (!doctype) {
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
        defaultValues={document_name ? { name: document_name } : {}}
      />
    </>
  );
};

export default ModalGenerator;
