import { Avatar, Flex, Text } from '@chakra-ui/react';
import React from 'react'
import Divider from './Divider';
import { formatDistanceToNowStrict } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { langAtom } from '@/atoms/langAtom';
import { ar } from 'date-fns/locale';

const Comment = ({ reply, lastReply }) => {
  const lang = useRecoilValue(langAtom);

  return (
    <>
      <Flex gap={4} py={2} my={2} w={'full'} justifyContent={'space-between'} alignItems={'flex-start'}>
        <Flex gap={4}>
          <Avatar.Root size={'sm'}>
              <Avatar.Fallback name=''/>
              <Avatar.Image src={reply.userProfilePic}/>
          </Avatar.Root>

          <Flex gap={1} w={'full'} flexDirection={'column'}>
              <Flex w={'full'} justifyContent={'space-between'} alignItems={'center'}>
                <Text fontSize={'sm'} fontWeight={'bold'}>{reply.username}</Text>
              </Flex>

              <Text>{reply.text}</Text>
          </Flex>
        </Flex>
        <Flex>
          <Text color={'gray.500'} fontWeight={'700'} fontSize={'xs'}>
            {lang === 'ar' && 'منذ '}
            {lang === 'ar' && formatDistanceToNowStrict(new Date(reply.createdAt), { locale: ar })}
            {lang !== 'ar' && formatDistanceToNowStrict(new Date(reply.createdAt))} 
            {lang !== 'ar' && ' ago'}
          </Text>
        </Flex>
      </Flex>

      {!lastReply && <Divider />}
      
    </>
  )
}

export default Comment
