import { useState } from "react";
import { Modal, Form, Select, DatePicker, Button, Row, Col, message } from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { ChevronDown, Star, X } from "lucide-react";

const { Option } = Select;

export default function CompleteCycleModal({ }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [move_tasks_to, setMoveTasksTo] = useState(null);
    const complete_cycle = searchParams.get("complete_cycle") || null;
    const [form] = Form.useForm();
    const [duration, setDuration] = useState("Custom");

    const tasks_query = useFrappeGetDocList("Task", {
        filters: [
            ["custom_cycle", "=", complete_cycle],
        ],
        fields: ["status", "name"],
        limit_page_length: 1000,
    }, ["cycle-tasks", complete_cycle], {
        isPaused: () => {
            return !complete_cycle
        }
    });

    const planned_cycles_query = useFrappeGetDocList("Cycle", {
        filters: [
            ["status", "in", ["Planned"]],
            ["name", "!=", complete_cycle],
        ],
        fields: ["name as value", "name as label"],
        limit_page_length: 100,
    }, ["planned-cycles", complete_cycle], {
        isPaused: () => {
            return !complete_cycle
        }
    });

    console.log("planned_cycles_query", planned_cycles_query.data);

    const open_tasks = (tasks_query.data || []).filter(task => task.status !== "Completed");
    const completed_tasks = (tasks_query.data || []).filter(task => task.status === "Completed");

    // const form_data_query = useFrappeGetDoc(
    //     "Cycle",
    //     complete_cycle,
    //     ["form_data", "Cycle", complete_cycle],
    //     {
    //         isPaused: () => {
    //             return !complete_cycle
    //         }
    //     }
    // );

    const mutation = useFrappePostCall("infintrix_atlas.api.v1.complete_cycle");

    const handleDurationChange = (value) => {
        setDuration(value);
        const startDate = dayjs();
        let endDate;

        if (value === "1 Week") {
            endDate = startDate.add(7, "days");
        } else if (value === "2 Week") {
            endDate = startDate.add(14, "days");
        } else if (value === "3 Week") {
            endDate = startDate.add(21, "days");
        } else {
            endDate = startDate;
        }

        form.setFieldsValue({
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleFinish = (values) => {
        console.log("Form Values:", values);
        mutation.call({
            cycle_name : complete_cycle,
            move_tasks_to : values.move_tasks_to,
          }).then((res)=>{
            message.success("Cycle Started Successfully");
            console.log("Cycle Started:", res);
            onClose();
          }).catch((err)=>{
            console.error("Error starting cycle:", err);
          })
    };

    const onClose = () => {
        searchParams.delete("complete_cycle");
        setSearchParams(searchParams);
    };


    // const form_data = form_data_query.data || {};

    console.log("tasks_length: ", open_tasks.length, completed_tasks.length);


    return (
        <Modal
            open={!!complete_cycle }
            // title={`Complete Cycle ${complete_cycle}`}
            onCancel={onClose}
            footer={null}
            width={720}
            loading={tasks_query.isLoading && planned_cycles_query.isLoading}
        >


            <div className="px-8 pt-6 pb-2">
                <header className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Complete {complete_cycle}</h2>
                </header>


                <section className="space-y-5 text-slate-700">
                    {/* 
                        <div className="relative h-36 bg-sky-500 flex items-center justify-center overflow-hidden">
                            <svg
                                className="absolute inset-0 w-full h-full opacity-30"
                                viewBox="0 0 400 200"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M0,80 C120,120 280,40 400,80 L400,0 L0,0 Z"
                                    fill="white"
                                />
                                <circle cx="50" cy="20" r="40" fill="white" fillOpacity="0.2" />
                                <circle cx="350" cy="40" r="30" fill="white" fillOpacity="0.1" />
                            </svg>

                            <div className="relative z-10">
                                <div className="relative flex justify-center">
                                    <div className="absolute -bottom-6 flex gap-3">
                                        <div
                                            className="w-6 h-12 bg-yellow-400 shadow-sm"
                                            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }}
                                        />
                                        <div
                                            className="w-6 h-12 bg-blue-600 shadow-sm"
                                            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }}
                                        />
                                    </div>

                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                        <Star className="w-12 h-12 text-blue-700 fill-blue-700" />
                                    </div>
                                </div>
                            </div>
                        </div> */}

                    {
                        open_tasks.length > 0 ? (
                            <>
                                <p className="text-[15px]">
                                    This sprint contains <span className="font-bold">{completed_tasks.length} completed work items</span> and <span className="font-bold">{open_tasks.length} open work items</span>.


                                </p>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 text-sm leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-1.5 shrink-0" />
                                        <span>
                                            Completed work items includes everything in the last column on the board,
                                            <a href="#" className="text-blue-600 hover:underline ml-1">Done</a>.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 text-sm leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-1.5 shrink-0" />
                                        <span>
                                            Open work items includes everything from any other column on the board. Move these to a new sprint or the backlog.
                                        </span>
                                    </li>
                                </ul>

                                {/* Form Control */}
                                <div className="pt-4 space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        Move open work items to
                                    </label>
                                    <Select
                                        style={{
                                            width: "100%"
                                        }}
                                        options={planned_cycles_query.data || []}
                                        value={move_tasks_to}
                                        onChange={(value) => setMoveTasksTo(value)}
                                        placeholder="Select Cycle"

                                    />
                                </div>
                            </>
                        ) : (<p className="text-[15px]">
                            This sprint contains {completed_tasks.length} completed work items. That's all of them - well done!
                        </p>
                        )
                    }




                </section>


            </div>


            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button onClick={onClose} size="large">
                    Cancel
                </Button>
                <Button
                disabled={open_tasks.length > 0 && !move_tasks_to}
                
                type="primary" htmlType="submit" size="large">
                    Complete Cycle
                </Button>
            </div>
        </Modal>
    );
}
