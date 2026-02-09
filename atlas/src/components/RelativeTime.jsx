import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

const RelativeTime = ({ date }) => {
    if (!date) return null
    return <div>{dayjs(date).fromNow()}</div>
}

export default RelativeTime
