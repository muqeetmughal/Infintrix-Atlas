import dayjs from "dayjs"

const RelativeTime = ({ date }) => {
    if (!date) return null
    return <div>{dayjs(date).fromNow()}</div>
}

export default RelativeTime
