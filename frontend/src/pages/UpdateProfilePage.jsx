import { Button, Flex, Heading, Input, Stack, Avatar, Center, Field, HStack, Float, CloseButton } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { useRecoilState, useRecoilValue } from 'recoil';
import userAtom from '@/atoms/userAtom';
import { useRef, useState } from 'react';
import usePreviewImg from '@/hooks/usePreviewImg';
import useShowToast from '@/hooks/useShowToast';
import { PasswordInput } from '@/components/ui/password-input';
import { Link } from 'react-router-dom';
import { LuArrowLeftFromLine, LuArrowRightFromLine } from 'react-icons/lu';
import { Toaster } from '@/components/ui/toaster';
import { langAtom } from '@/atoms/langAtom';

export default function UpdateProfilePage() {
  const [ user, setUser ] = useRecoilState(userAtom);
  const lang = useRecoilValue(langAtom);
  
  const [ updating, setUpdating ] = useState(false);
  const [ inputs, setInputs ] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    password: '',
    lang: user.lang || lang,
  });

  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const { showErrorToast, showSuccessToast } = useShowToast();

  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/update/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({...inputs, profilePic: imgUrl})
      });
      
      const data = await res.json();
      if(data.error){
        showErrorToast(data.error);
        return;
      };
      
      showSuccessToast(data.message);
      setUser(data.user);
      localStorage.setItem("user-sharex", JSON.stringify(data.user));
    } catch (error) {
      showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
    } finally {
      setUpdating(false);
    };
  }

  return (
    <form onSubmit={handleSubmit}>
      <Toaster />
      <Flex
        align={'center'}
        justify={'center'}
        >
        <Stack
          spacing={4}
          w={'full'}
          maxW={'md'}
          bg={useColorModeValue('white', 'gray.900')}
          rounded={'xl'}
          boxShadow={'2xl'}
          p={6}
          my={6}
          >
          <HStack gap={'3%'}>
            <Link style={{width: '10%'}} to={`/${user.username}`}>
              <Button variant={'subtle'} w={'10%'}>
                {lang === 'ar' ? <LuArrowRightFromLine size={25} /> : <LuArrowLeftFromLine size={25}/>} 
              </Button>
            </Link>
            <Heading lineHeight={1.1} fontSize={{ base: '2xl', sm: '3xl' }}>
              {lang === 'ar' ? "تحرير الملف الشخصي" : "User Profile Edit"}
            </Heading>
          </HStack>
          <Field.Root id="userName">
            <Stack direction={['column', 'row']} spacing={6} w={'full'} gap={'10%'}>
              <Center>
                <Avatar.Root size="2xl">
                  <Avatar.Fallback name={user.name} />
                  <Avatar.Image src={imgUrl || user.profilePic} />
                  <Float>
                    <CloseButton 
                      size={'xs'} 
                      borderRadius={'full'} 
                      top={'5px'} 
                      onClick={() => {
                        setImgUrl("");
                        if(fileRef) fileRef.current.value = "";
                      }}  
                    />
                  </Float>
                </Avatar.Root>
              </Center>
              <Center w="full">
                <Button variant={'surface'} w="full" onClick={() => fileRef.current.click()}>
                  {lang === 'ar' ? "تغيير الصورة الشخصية" : "Change Avatar"}
                </Button>
                <Input type='file' hidden ref={fileRef} onChange={handleImageChange}/>
              </Center>
            </Stack>
          </Field.Root>
          
          <Field.Root id="name">
            <Field.Label>
              {lang === 'ar' ? "الاسم الكامل" : "Full name"}
            </Field.Label>
            <Input
              placeholder={lang === 'ar' ? "علي سالمة" : "Elon Mask"}
              _placeholder={{ color: 'gray.500' }}
              type="text"
              value={inputs.name}
              onChange={(e) => setInputs({...inputs, name: e.target.value})}
            />
          </Field.Root>

          <Field.Root id="username">
            <Field.Label>
              {lang === 'ar' ? "اسم المستخدم" : "User name"}
            </Field.Label>
            <Input
              placeholder={lang === 'ar' ? "علي_145" : "elon_212"}
              _placeholder={{ color: 'gray.500' }}
              type="text"
              value={inputs.username}
              onChange={(e) => setInputs({...inputs, username: e.target.value})}
            />
          </Field.Root>

          <Field.Root id="email">
            <Field.Label>
              {lang === 'ar' ? "البريد الالكتروني" : "Email address"} 
            </Field.Label>
            <Input
              placeholder="elon@email.com"
              _placeholder={{ color: 'gray.500' }}
              type="email"
              value={inputs.email}
              onChange={(e) => setInputs({...inputs, email: e.target.value})}
            />
          </Field.Root>

          <Field.Root id="bio">
            <Field.Label>
              {lang === 'ar' ? "نبذة" : "Bio"}
            </Field.Label>
            <Input
              placeholder={lang === 'ar' ? "نبذة عنك..." : "Your bio..."}
              _placeholder={{ color: 'gray.500' }}
              type="text"
              value={inputs.bio}
              onChange={(e) => setInputs({...inputs, bio: e.target.value})}
            />
          </Field.Root>

          <Field.Root id="password">
            <Field.Label>
              {lang === 'ar' ? "كلمة المرور" : "Password"}
            </Field.Label>
            <PasswordInput
              placeholder={lang === 'ar' ? "كلمة المرور" : "Password"}
              _placeholder={{ color: 'gray.500' }}
              type="password"
              value={inputs.password}
              onChange={(e) => setInputs({...inputs, password: e.target.value})}
            />
          </Field.Root>
          
          <HStack spacing={6} direction={['column', 'row']} w={'full'} mt={'10px'}>
            <Link style={{width: '100%'}} to={`/${user.username}`}>
              <Field.Root>
                <Button
                    bg={'red.400'}
                    color={'white'}
                    w="full"
                    _hover={{
                      bg: 'red.500',
                    }}
                    >
                    {lang === 'ar' ? "إلغاء" : "Cancel"}
                </Button>
              </ Field.Root>
            </Link>

              <Field.Root>
                <Button
                    bg={'green.400'}
                    color={'white'}
                    w="full"
                    _hover={{
                    bg: 'green.500',
                  }}
                  type='submit'
                  loading={updating}
                  loadingText={lang === 'ar' ? "جار الحفظ ..." : "Saving..."}
                  onClick={handleSubmit}
                >
                  {lang === 'ar' ? "حفظ" : "Save"}
                </Button>
              </Field.Root>
          </HStack>
        </Stack>
      </Flex>
    </form>
  )
}