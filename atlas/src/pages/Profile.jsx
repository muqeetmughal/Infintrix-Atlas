import React from 'react'
import UserDetails from '../components/UserDetails'
import { useAuth } from '../hooks/query';

const Profile = () => {

      const auth = useAuth();

  const user = auth?.user;
  return (
    <>
      <UserDetails user={user} />
    </>
  )
}

export default Profile
