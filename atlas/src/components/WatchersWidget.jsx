import { Button, Badge, Dropdown, Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { use, useState } from "react";
import { X } from "lucide-react";
import { UsersSelectWidget } from "./widgets/AssigneeSelectWidget";
import {
  useFrappeGetCall,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

const WatchersWidget = ({ doctype = "Task", docname = null }) => {
  const add_watcher_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.add_watcher",
  );
  const delete_watcher_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.remove_watcher",
  );
  const toggle_watch = useFrappePostCall(
    "infintrix_atlas.api.v1.toggle_self_watch",
  );
  const watchers_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_watchers",
    {
      doctype: doctype,
      docname: docname,
    },
  );
  const current_user_watching_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.current_user_is_watching",
    {
      doctype: doctype,
      docname: docname,
    },
  );

  const current_user_is_watching = current_user_watching_query?.data?.message || false;
  const watchers = watchers_query?.data?.message || [];


  return (
    <Badge count={watchers.length}>
      <Dropdown
        placement="bottomRight"
        popupRender={() => {
          return (
            <div className="bg-white dark:bg-slate-900 shadow-lg rounded-md w-64">
              <div className="p-2 border-b border-gray-200 dark:border-slate-700 mb-2">
                <Button
                  block
                  type={"text"}
                  icon={<EyeOutlined />}
                  onClick={() => {
                    toggle_watch.call({ doctype, docname }).then(() => {
                      watchers_query.mutate();
                      current_user_watching_query.mutate();
                    });
                  }}
                >
                  {current_user_is_watching
                    ? "Stop Watching"
                    : "Start Watching"}
                </Button>
              </div>

              {watchers.length > 0 ? (
                <div className="p-2">
                  {watchers_query.isValidating ? (
                    <Spin />
                  ) : (
                    watchers.map((watcher, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between mb-2"
                      >
                        <div className="flex items-center">
                          <img
                            src={
                              watcher.user_image
                                ? watcher.user_image
                                : createAvatar(botttsNeutral, {
                                    seed: watcher.full_name,
                                  }).toDataUri()
                            }
                            alt={watcher.full_name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-gray-900 dark:text-gray-100">
                            {watcher.full_name}
                          </span>
                        </div>
                        <Button
                          type="text"
                          icon={<X size={12} />}
                          onClick={() => {
                            delete_watcher_mutation
                              .call({
                                doctype,
                                docname,
                                user: watcher.user,
                              })
                              .then(() => {
                                watchers_query.mutate();
                                current_user_watching_query.mutate();
                              });
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex justify-center p-2 text-gray-500 dark:text-gray-400">
                  No watchers yet
                </div>
              )}

              <UsersSelectWidget
                onSelect={(value) => {
                  add_watcher_mutation
                    .call({
                      doctype,
                      docname,
                      user: value,
                    })
                    .then(() => {
                      watchers_query.mutate();
                      current_user_watching_query.mutate();
                    });
                }}
              />
            </div>
          );
        }}
        trigger={"click"}
        menu={null}
      >
        <Button type="default" icon={<EyeOutlined />} />
      </Dropdown>
    </Badge>
  );
};

export default WatchersWidget;
