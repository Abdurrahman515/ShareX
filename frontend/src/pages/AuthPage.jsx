import authScreenAtom from '@/atoms/authAtom'
import LoginCard from '@/components/other/LoginCard'
import SignupCard from '@/components/other/SignupCard'
import React from 'react'
import { useRecoilValue } from 'recoil'

const AuthPage = () => {
  const authScreenState = useRecoilValue(authScreenAtom);
  return (
    <>
      {authScreenState == "login" ? <LoginCard /> : <SignupCard />}
    </>
  )
}

export default AuthPage
