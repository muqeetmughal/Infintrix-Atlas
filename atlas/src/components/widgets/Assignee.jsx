const Assignee = ({ assignees = [] }) => {
    if (!assignees.length) {
        return null;
    }

    return (
        <div className="flex -space-x-2">
            {assignees.map((assignee, i) => {
                const initials = assignee
                    .split(' ')
                    .map(name => name.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                return (
                    <div
                        key={assignee}
                        className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700"
                        title={assignee}
                    >
                        {initials}
                    </div>
                );
            })}
        </div>
    );
};

export default Assignee;
