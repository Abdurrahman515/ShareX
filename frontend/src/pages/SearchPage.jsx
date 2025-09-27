import { langAtom } from '@/atoms/langAtom'
import { useColorModeValue } from '@/components/ui/color-mode'
import { SearchIcon } from '@chakra-ui/icons'
import { Avatar, Box, Button, Flex, Input, Spinner, Text } from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { LuSearchX } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'

const SearchPage = () => {
  const [ users, setUsers ] = useState([]);
  const [ loading, setLoading ] = useState(false);
  const [ foundedUsers, setFoundedUsers ] = useState([]);
  const [ searchText, setSearchText ] = useState("");

  const lang = useRecoilValue(langAtom);

  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.300', 'gray.900');

  useEffect(() => {
    const getAllUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/users/allusers');
        const data = await res.json();

        if(data.error) return console.log(data.error);

        setUsers(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getAllUsers();
  }, []);

  const searchUsers = useCallback(() => {
    if(searchText.trim()){
      const result = users.filter(user => {
        return user.username.includes(searchText);
      });
      
      setFoundedUsers(result);
      
      if(!result[0]){
        const result2 = users.filter(user => {
          return user.name.toLowerCase().includes(searchText);
        })
        setFoundedUsers(result2);
      };
      
    } else {
      setFoundedUsers([]);
    };
  }, [searchText, users]);
  
  useEffect(() => {
    if(searchText.trim()){
      searchUsers();
    };
  }, [searchText, searchUsers, users]);
  
  return (
    <Flex gap={2} flexDir={'column'}>
      <Flex gap={2} w={'full'}>
        <Input 
          placeholder={lang === 'ar' ? "اكتب هنا للبحث..." : 'Type here to search...'} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyUp={searchUsers}
          autoFocus
        />
        <Button variant={'subtle'} onClick={searchUsers}>
          <SearchIcon fontSize={16}/>
        </Button>
      </Flex>

      {!searchText.trim() && (
        <Flex w={'full'} flexDir={'column'} gap={5} justifyContent={'center'} alignItems={'center'} h={'250px'}>
          <Box color={textColor}>
            <SearchIcon fontSize={50}/>
          </Box>
          <Text fontSize={'xl'} fontWeight={'700'} color={textColor}>
            {lang === 'ar' ? "اكتب اسم المستخدم او الاسم المستعار للمستخدم للبحث!" : "Type the username or name of the user to search!"} 
          </Text>
        </Flex>
      )}

      {!foundedUsers[0] && searchText.trim() && !loading && (
        <Flex h={'200px'} borderRadius={'md'} justifyContent={'center'} alignItems={'center'} flexDir={'column'} gap={4}>
          <Box justifySelf={'center'} color={'gray.400'}>
            <LuSearchX size={50}/>
          </Box>
          <Text fontSize={'xl'} color={'gray.400'} fontWeight={'700'}>
            {lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found!"} 
          </Text>
        </Flex>
      )}

      {loading && searchText.trim() && (
        <Flex justifyContent={'center'} alignItems={'center'} h={'40vh'}>
          <Spinner size={'xl'}/>
        </Flex>
      )}

      {!loading && foundedUsers && searchText.trim() && (
        <Flex flexDir={'column'} gap={2} maxH={'400px'} overflow={'auto'} mt={4}>
          {foundedUsers.map(user => (
            <Flex key={user._id} justifyContent={'center'} alignItems={'center'} _hover={{bg: hoverBg}} borderRadius={'md'} p={1}>
              <Link to={`/${user.username}`} style={{width: '100%'}}>
                <Flex gap={2} alignItems={'center'} w={'full'}>
                  <Avatar.Root>
                    <Avatar.Fallback name={user.name}/>
                    <Avatar.Image src={user.profilePic}/>
                  </Avatar.Root>

                  <Flex flexDir={'column'}>
                    <Text fontWeight={'700'}>{user.username}</Text>
                    <Text color={textColor} fontWeight={'700'}>{user.name}</Text>
                  </Flex>
                </Flex>
              </Link>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

export default SearchPage;
