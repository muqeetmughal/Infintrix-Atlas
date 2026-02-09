import React from 'react'
import UserDetails from '../components/UserDetails'
import { useFrappeGetDoc } from 'frappe-react-sdk'
import { useParams } from 'react-router-dom'

const TeamDetail = () => {

    const params = useParams()

    const user_detail_query = useFrappeGetDoc("User", params.id);

    const user = user_detail_query.data;
  return (
      <>
      <UserDetails user={user} />
    </>
  )
}

export default TeamDetail
