import Badge from '../ui/Badge'
import { TASK_PRIORITY_COLORS } from '../../data/constants'
import {   ChevronsDown, ChevronsUp, ChevronUp, TriangleAlert } from 'lucide-react'

const priorityIcons = {
    Low: <ChevronsDown size={12} />,
    Medium: <ChevronUp size={12} />,
    High: <ChevronsUp size={12} />,
    Urgent: <TriangleAlert size={12} />
}

const Priority = ({ priority }) => {
    return (
        <Badge className={TASK_PRIORITY_COLORS[priority]}>
            <span className="flex items-center gap-1">
                <span>{priorityIcons[priority]}</span>
                <span>{priority}</span>
            </span>
        </Badge>
    )
}

export default Priority