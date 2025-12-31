import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form';

const DateField = ({
    field,
    control,
    common
}) => {
    const dateRef = React.useRef(null);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewDate, setViewDate] = useState(new Date());
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) setIsDatePanelOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => {
                        const newDate = new Date(year, month, day);
                        setSelectedDate(newDate);
                        setIsDatePanelOpen(false);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-full text-sm transition-all
            ${isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}
            ${isToday && !isSelected ? 'text-blue-600 font-bold border border-blue-200' : 'text-gray-700'}
          `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };
    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    return (
        <>
            <div className="relative" ref={dateRef}>

                <Controller
                    name={field.name || field.fieldname}
                    {...common}
                    control={control}
                    render={({ field: f }) => (
                        <div
                         {...f}
                            onClick={() => setIsDatePanelOpen(!isDatePanelOpen)}
                            className="w-full px-4 py-4 border border-slate-300 rounded-lg cursor-pointer bg-white text-slate-700 flex justify-between items-center"
                        >
                            <span>{selectedDate ? selectedDate.toLocaleDateString() : 'Pick Date'}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                />


                <label className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-blue-600">{field.label}</label>
                {isDatePanelOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="font-semibold text-sm">
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-7 text-[10px] font-bold text-slate-400 uppercase text-center mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 text-center">
                            {renderCalendar()}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default DateField