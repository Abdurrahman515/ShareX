import { langAtom } from '@/atoms/langAtom'
import useFollowUnfollow from '@/hooks/useFollowUnfollow'
import { Avatar, Box, Button, Flex, Text } from '@chakra-ui/react'
import React from 'react'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'

const SuggestedUser = ({ user }) => {
    const lang = useRecoilValue(langAtom);

    const { following, handleFollowUnfollow, loading} = useFollowUnfollow(user);

  return (
    <Flex gap={2} justifyContent={'space-between'} alignItems={'center'}>
        {/* left side */}
        <Flex gap={2} as={Link} to={`${user.username}`}>
            <Avatar.Root>
                <Avatar.Fallback name={user.name} />
                <Avatar.Image src={user.profilePic}/>
            </Avatar.Root>
            <Box>
                <Text fontSize={'sm'} fontWeight={'bold'}>
                    {user.username}
                </Text>
                <Text fontSize={'sm'} color={'gray.400'}>
                    {user.name}
                </Text>
            </Box>
        </Flex>
        {/* right side */}
        <Button
            size={'sm'}
            color={following ? "black" : "white"}
            bg={following ? "white" : "blue.400"}
            onClick={handleFollowUnfollow}
            loading={loading}
            _hover={{
                color: following? "black" : "white",
                opacity: '0.8'
            }}
        >
            {following && lang === 'ar' ? "إلغاء المتابعة" 
            :!following && lang === 'ar' ? "متابعة" 
            :following && lang !== 'ar' ? "Unfollow" 
            : "Follow"}
        </Button>
    </Flex>
  )
}

export default SuggestedUser
