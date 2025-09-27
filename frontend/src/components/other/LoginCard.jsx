import { Flex, Box, Field, Input, InputGroup, Stack, Button, Heading, Text, Link } from '@chakra-ui/react';
import { PasswordInput } from '../ui/password-input';
import { useColorModeValue } from '../ui/color-mode';
import { useRecoilState, useSetRecoilState } from 'recoil';
import authScreenAtom from '@/atoms/authAtom';
import { useState } from 'react';
import userAtom from '@/atoms/userAtom';
import useShowToast from '@/hooks/useShowToast';
import { langAtom } from '@/atoms/langAtom';

export default function LoginCard() {
  const [ loading, setLoading ] = useState(false);
  const [ inputs, setInputs ] = useState({
    username: "",
    password: ""
  });
  
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const setUser = useSetRecoilState(userAtom);
  const [ lang, setLang ] = useRecoilState(langAtom);
  
  const { showSuccessToast, showErrorToast } = useShowToast();
  
  const inputsToSend = { 
    username: inputs.username.trim(), 
    password: inputs.password.trim(),
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return;
    if(!inputs.username.trim() || !inputs.password.trim()){
      showErrorToast(lang === 'ar' ? "يرجى ملئ جميع الحقول!" : 'Please fill in all fields!');
      return;
    };
    setLoading(true);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify(inputsToSend)
      });
      const data = await res.json();

      if(data.error) {
        showErrorToast(data.error);
        return;
      };

      localStorage.setItem("user-sharex", JSON.stringify(data));
      setUser(data);
      setLang(data.lang);

      showSuccessToast(lang === 'ar' ? "تم تسجيل الدخول بنجاح!" : 'Logged in successfully!')
    } catch (error) {
      showErrorToast(error.message || "Something went wrong!");
    } finally{
      setLoading(false);
    };
  };

  return (
    <Flex
      align={'center'}
      justify={'center'}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={6} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'} textAlign={'center'} >
            {lang === 'ar' ? "تسجيل الدخول" : "Login"}
          </Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.900')}
          boxShadow={"2xl"}
          p={8}
          mt={5}
          w={{
            base: "full",
            sm: "400px"
          }}
          >
            <form onSubmit={handleLogin}>
              <Stack spacing={4}>
                <Field.Root id="username" required>
                    <Field.Label>
                    {lang === 'ar' ? '(الاسم المستعار) اسم المستخدم' : 'User name'}
                    <Field.RequiredIndicator />
                    </Field.Label>
                    <Input data-testid={'username-inp'} type="text" onChange={(e) => setInputs({...inputs, username: e.target.value})} value={inputs.username}/>
                </Field.Root>

                <Field.Root id="password" required>
                  <Field.Label>
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <InputGroup>
                    <PasswordInput data-testid={'password-inp'} onChange={(e) => setInputs({...inputs, password: e.target.value})} value={inputs.password}/>
                  </InputGroup>
                </Field.Root>

                <Stack spacing={10} pt={2}>
                  <Button
                    size="lg"
                    bg={useColorModeValue('gray.600', 'gray.700')}
                    color={'white'}
                    _hover={{
                      bg: useColorModeValue('gray.700', 'gray.800'),
                    }}
                    type='submit'
                    loading={loading} 
                    data-testid={'login-btn'}
                    onClick={(e) => {
                      if(!inputs.username.trim() || !inputs.password.trim()){
                        e.preventDefault();
                        showErrorToast(lang === 'ar' ? "يرجى ملئ جميع الحقول!" : 'Please fill in all fields!');
                        return;
                      }
                    }}
                  >
                    {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                </Stack>
                <Stack pt={6} align={'center'}>
                  <Text align={'center'}>
                    {lang === 'ar' ? "ليس لديك حساب؟" : "Don't have an account?"} <Link color={'blue.500'} 
                    onClick={() => setAuthScreen("signup")}>
                      {lang === 'ar' ? 'إنشاء حساب' : "Sign up"}
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
        </Box>
      </Stack>
    </Flex>
    
  )
}