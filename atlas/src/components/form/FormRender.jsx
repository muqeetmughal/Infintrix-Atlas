import { useForm } from "react-hook-form";
import { FormField } from "./FormField";
import { Link } from "react-router-dom";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import {useDoctypeSchema} from "../../hooks/doctype";
import { X } from "lucide-react";

export default function FormRender({
  doctype = null,
  open = false,
  onClose,
  full_form = true,
  defaultValues = {},
}) {
  // console.log(doctype, open, full_form, defaultValues);
  const form = useForm({ defaultValues });
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, ...formData },
  } = form;

  const query = useDoctypeSchema(doctype);

  const mutation = useFrappeCreateDoc();

  // if (query.isLoading || (!open && !full_form && !Object.keys(defaultValues).length) || !schema?.fields) return null;

  if (query.isLoading) return <div>Loading...</div>;

  const schema = query.data || {};
    // console.log("SCHEMA:", schema);
  let fields = schema?.fields || [];
  //   .filter(
  //     (f) => !["Section Break", "Column Break"].includes(f.fieldtype)
  //     // && f.allow_in_quick_entry === 1
  //   );


  if (schema.quick_entry && !full_form){
    fields = fields.filter(f => f.allow_in_quick_entry === 1);
  }


  const onSubmit = (data) => {
    console.log("FORM DATA:", data);
    mutation.createDoc(doctype, data).then((res) => {
      console.log("CREATED:", res);
      onClose();
    });
  };

  const form_render = (
    <div className="bg-white w-full max-w-7xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {Object.keys(defaultValues).length ? "Edit" : "Create"} {schema.name}
        </h2>
        <button onClick={onClose} className="cursor-pointer text-gray-500">
          ✕
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`grid grid-cols-3 gap-4`}
      >
        {fields.map((field) => {
          // console.log("FIELD:", field.fieldname,field.fieldtype);
          // if (field.fieldtype === "Column Break") {
          //     return null;
          // }
          return (
            <div key={field.name}>
              <FormField key={field.name} field={field} control={control} errors={errors} />

              {/* <button
                  type="button"
                  onClick={() => control._reset({ [field.fieldname]: '' })}
                  className="relative top-0  bg-gray-100 hover:bg-gray-150 cursor-pointer text-xs text-gray-500 hover:text-gray-700 underline mt-1"
                >
                  <X size={12} className=" rounded-full"/>
                </button> */}

              {errors[field.fieldname] && (
                <span className="text-red-500 text-sm">
                  {errors[field.fieldname]?.message}
                </span>
              )}
            </div>
          );
        })}
        {!full_form && (
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Link
              to={`/${String(doctype).toLowerCase()}s/create`}
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Full Form
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              // disabled={isSubmitting}
              className={`w-40 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 uppercase tracking-widest text-sm transition-all active:scale-[0.98] hover:bg-blue-700 hover:shadow-blue-300`}
            >
              Submit
            </button>
          </div>
        )}
      </form>
    </div>
  );

  if (full_form) {
    return form_render;
  }

  if (open && !full_form) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        {form_render}
      </div>
    );
  }
}
