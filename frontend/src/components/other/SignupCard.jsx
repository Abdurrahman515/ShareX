import { Flex, Box, Field, Input, InputGroup, HStack, Stack, Button, Heading, Text, Link } from '@chakra-ui/react';
import { PasswordInput } from '../ui/password-input';
import { useColorModeValue } from '../ui/color-mode';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import authScreenAtom from '@/atoms/authAtom';
import { useState } from 'react';
import userAtom from '@/atoms/userAtom';
import useShowToast from '@/hooks/useShowToast';
import { langAtom } from '@/atoms/langAtom';

export default function SignupCard() {
  const [ loading, setLoading ] = useState(false)
  const [ inputs, setInputs ] = useState({
    name: "",
    username: "",
    email: "",
    password: ""
  });
  
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const setUser = useSetRecoilState(userAtom);
  const lang = useRecoilValue(langAtom);

  const { showErrorToast, showSuccessToast } = useShowToast();

  const inputsToSend = {
    name: inputs.name.trim(),
    username: inputs.username.trim(),
    email: inputs.email.trim(),
    password: inputs.password.trim(),
    lang: navigator.language.slice(0, 2)
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if(loading) return;
    if(!inputs.username.trim() || !inputs.name.trim() || !inputs.password.trim() || !inputs.email.trim()){
      showErrorToast(lang === 'ar' ? "يرجى ملئ جميع الحقول!" : 'Please fill in all fields!')
      return;
    };
    setLoading(true)
    try {
      // doesn't started with http://localhost:5000 because it's already wroten in target (at vite.config.js)
      const res = await fetch(`/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inputsToSend)
      });
      const data = await res.json();

      if(data.error){
        showErrorToast(data.error);
        return;
      };

      localStorage.setItem("user-sharex", JSON.stringify(data));
      setUser(data);

      showSuccessToast(lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : "Account created successfully!");
    } catch (error) {
      showErrorToast(error.message || "Something went wrong!");
    } finally{
      setLoading(false);
    };
  }
  return (
    <Flex
      align={'center'}
      justify={'center'}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={6} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'} textAlign={'center'} >
            {lang === 'ar' ? "إنشاء حساب" : "Sign up"} 
          </Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.900')}
          boxShadow={"2xl"}
          p={8}
          mt={5}
        >
          <form onSubmit={handleSignup}>
            <Stack spacing={4}>
              <HStack>
                <Box>
                  <Field.Root id="name" required>
                    <Field.Label>
                      {lang === 'ar' ? 'الاسم الكامل' : "Full Name"}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input type="text" 
                      onChange={(e) => setInputs({...inputs, name: e.target.value})}
                      value={inputs.name}
                      data-testid={"full-name-inp"}
                    />
                  </Field.Root>
                </Box>
                <Box>
                  <Field.Root id="username" required>
                    <Field.Label>
                      {lang === 'ar' ? "(الاسم المستعار) اسم المستخدم" : "User name"}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input type="text" 
                      onChange={(e) => setInputs({...inputs, username: e.target.value})}
                      value={inputs.username}
                      data-testid={"username-inp"}
                    />
                  </Field.Root>
                </Box>
              </HStack>
              <Field.Root id="email" required>
                <Field.Label>
                  {lang === 'ar' ? 'البريد الالكتروني' : "Email address"}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input type="email" 
                  onChange={(e) => setInputs({...inputs, email: e.target.value})}
                  value={inputs.email}
                  data-testid={"email-inp"}
                />
              </Field.Root>
              <Field.Root id="password" required>
                <Field.Label>
                  {lang === 'ar' ? 'كلمة المرور' : "Password"} 
                  <Field.RequiredIndicator />
                </Field.Label>
                <InputGroup>
                  <PasswordInput 
                    onChange={(e) => setInputs({...inputs, password: e.target.value})}
                    value={inputs.password}
                    data-testid={"password-inp"}
                  />
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
                  onClick={handleSignup}
                  data-testid={'signup-btn'}
                >
                  {lang === 'ar' ? "إنشاء حساب" : "Sign up"}
                </Button>
              </Stack>
              <Stack pt={6} align={'center'}>
                <Text align={'center'}>
                  {lang === 'ar' ? "لديك حساب بالفعل؟" : "Already a user?"} <Link color={'blue.500'}
                  onClick={() => setAuthScreen("login")}>
                    {lang === 'ar' ? 'تسجيل الدخول' : "Login"} 
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