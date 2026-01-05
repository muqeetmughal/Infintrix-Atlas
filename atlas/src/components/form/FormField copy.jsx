import { Controller } from "react-hook-form";
import DateField from "./DateField";
import LinkField from "./LinkField";
import { Checkbox, ColorPicker, DatePicker, Input, InputNumber, Select } from "antd";

export function FormField({ field, control }) {

  if (
    field.hidden ||
    field.fieldtype === "Section Break" ||
    field.fieldtype === "Column Break"
  ) {
    return null;
  }

  const common = {
    name: field.fieldname,
    rules: field.reqd ? { required: "Required" } : undefined,
  };

  switch (field.fieldtype) {
    case "Data":
      return (
        <div className="relative">
          <Controller
            control={control}
            {...common}
            render={({ field: f }) => (
              <Input
                label={field.label}
                {...f}
                type="text"
                // className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
                placeholder={field.label}
              />
            )}
          />
          {/* <label
            htmlFor={field.fieldname}
            className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:left-3 pointer-events-none"
          >
            {field.label}
          </label> */}
        </div>
      );
    case "Link":
      return <LinkField field={field} control={control} common={common} />;
    case "Int":
      return (
        <div className="relative">
          <Controller
            control={control}
            {...common}
            render={({ field: f }) => (
                <InputNumber
                       {...f}
                       precision={0}
                // type="number"
                // className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
                placeholder={field.label}
                />
            //   <InputNumber
            //     {...f}
            //     type="number"
            //     className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
            //     placeholder={field.label}
            //   />
            )}
          />
          {/* <label
            htmlFor={field.fieldname}
            className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:left-3 pointer-events-none"
          >
            {field.label}
          </label> */}
        </div>
      );
    case "Float":
      return (
        <div className="relative">
          <Controller
            control={control}
            {...common}
            render={({ field: f }) => (
              <input
                {...f}
                type="text"
                className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
                placeholder={field.label}
              />
            )}
          />
          <label
            htmlFor={field.fieldname}
            className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:left-3 pointer-events-none"
          >
            {field.label}
          </label>
        </div>
      );

    case "Select":
      return (
          <Controller
            {...common}
            control={control}
            defaultValue={field.default}
            render={({ field: f }) => (
                <Select 
                {...f}
                className="w-full"
                placeholder={`Select ${field.label}`}
                options={field.options
                  .split("\n")
                  .map((opt) => ({ label: opt, value: opt }))}
                
                />
            //   <select
            //     {...f}
            //     className="peer w-full px-4 py-4 border border-gray-300 rounded-md outline-none bg-white transition-all appearance-none"
            //   >
            //     <option disabled selected hidden value="">
            //       Select
            //     </option>
            //     {field.options.split("\n").map((opt) => (
            //       <option key={opt} value={opt}>
            //         {opt}
            //       </option>
            //     ))}
            //   </select>
            )}
          />
      );

    case "Check":
      return (
        <label className="flex items-center space-x-3 cursor-pointer">
          <Controller
            {...common}
            control={control}
            render={({ field: f }) => (
              <Checkbox
                {...f}
                checked={!!f.value}
                onChange={(e) => f.onChange(e.target.checked)}
                // type="checkbox"
                // className="w-5 h-5 border-2 border-slate-300 rounded text-blue-600 focus:ring-0 transition-colors"
              />
            )}
          />

          <span className="text-sm text-slate-600">{field.label}</span>
        </label>
      );

    case "Date":
      return (
        // <DateField field={field} control={control} />
        // <div className="flex flex-col gap-1">
        //     <label>{field.label}</label>
        //     <Controller
        //         {...common}
        //         control={control}
        //         render={({ field: f }) => (
        //             <input type="date" {...f} className="border rounded px-3 py-2" />
        //         )}
        //     />
        // </div>

        <div className="relative">
          <Controller
            control={control}
            {...common}
            render={({ field: f }) => (
              <DatePicker
                {...f}
                placeholder={field.label}
              />
            )}
          />
          {/* <label
            htmlFor={field.fieldname}
            className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:left-3 pointer-events-none"
          >
            {field.label}
          </label> */}
        </div>
      );
    case "Datetime":
      return (
        <div className="relative">
          <Controller
            control={control}
            {...common}
            render={({ field: f }) => (
              <DatePicker
                {...f}
                className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
                placeholder={field.label}
                format="DD/MM/YYYY hh:mm A"
                onChange={(date, dateString) => console.log(date, dateString)}
                showTime={{ use12Hours: true }}
              />
            )}
          />
        </div>
      );
    // case "Text":
    // case "Text Editor":
    //     return (
    //         <div className="flex flex-col gap-1">
    //             <label>{field.label}</label>
    //             <Controller
    //                 {...common}
    //                 render={({ field: f }) => (
    //                     <textarea className="border rounded p-2 min-h-[80px]" {...f} />
    //                 )}
    //             />
    //         </div>
    //     );
    case "Currency":
        return <div className="relative" >
            <Controller
                control={control}
                {...common}
                render={({ field: f }) => (
                    <Input
                        {...f}
                        type="number"
                        // prefix={field.options || "$"}
                        // className="peer w-full px-4 py-4 border border-slate-300 rounded-lg outline-none transition-all focus:border-blue-600 focus:border-2 placeholder-transparent text-slate-700"
                        placeholder={field.label}
                    />
                )}
            />
        </div>
    case "Color":
        return (
            <div className="relative">
                <Controller
                    control={control}
                    {...common}
                    render={({ field: f }) => (
                        <ColorPicker
                            value={f.value || null}
                            onChange={(color) => f.onChange(color?.toHexString())}
                            showText
                            allowClear
                        />
                    )}
                />
            </div>
        );


    default:
      return "Unknown Field Type (" + field.fieldtype +" - "+ field.fieldname + ")";
  }
}
