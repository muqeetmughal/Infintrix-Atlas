import { Button, Input } from "antd";
import { Check, X } from "lucide-react";
import React from "react";

const TextWidget = (props) => {
  const [editable, setEditable] = React.useState(false);
  const [newValue, setNewValue] = React.useState(props.value);



  return (
   
      <>
        <Input
        {...props}
          value={newValue}
          variant={editable ? undefined : "borderless"}
          onClick={() => setEditable(true)}
          onChange={(e) => {
            setNewValue(e.target.value);
          }}
          onKeyDown={(e)=>{
            if (e.key === "Enter") {
              props.onSubmit(newValue);
              setEditable(false);
            } else if (e.key === "Escape") {
              setNewValue(props.value);
              setEditable(false);
            }
          }}
          autoFocus
          className="text-2xl font-semibold mb-6 leading-tight p-0"
        />
        {editable && (
          <div className="text-start">
         

            <Button
              size="small"
              icon={<Check />}
              type="primary"
              onClick={() => {
                props.onSubmit(newValue);
                setEditable(false);
              }}
            />
               <Button
              // type="primary"
              // danger
              size="small"
              icon={<X />}
              onClick={() => {
                setNewValue(props.value);
                setEditable(false);
              }}
              className="mr-1"
            />
          </div>
        )}
      </>
  );
};

export default TextWidget;
