import { useEffect, useState } from 'react';

const useRealtime = (event_name) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (typeof frappe !== 'undefined' && frappe.realtime) {
            frappe.realtime.on(event_name, (receivedData) => {
                setData(receivedData);
            });

            return () => {
                frappe.realtime.off(event_name);
            };
        }
    }, [event_name]);

    return data;
};

export default useRealtime;