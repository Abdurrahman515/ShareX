import { langAtom } from '@/atoms/langAtom';
import { Flex, Text } from '@chakra-ui/react'
import React from 'react'
import { RiWifiOffFill } from "react-icons/ri";
import { useRecoilValue } from 'recoil';
import { useColorModeValue } from '../ui/color-mode';

const NoInternet = () => {
  const lang = useRecoilValue(langAtom);

  return (
    <Flex height={'70vh'} w={'full'} justifyContent={'center'} alignItems={'center'} flexDir={'column'} dir='rtl'>
        <RiWifiOffFill size={90} color={useColorModeValue('#3d3c3cff', '#616060b2')} />
        <Text fontSize={50} color={'gray.700'} fontWeight={'700'} textAlign={'center'}>
          {lang === 'ar' ? "لا يوجد اتصال بالانترنت!" : "No Internet Connection!"}
        </Text>

        {lang === 'ar' ? (
          <Text mt={3} color={'gray.700'} fontWeight={'700'}>
            <u>ملاحظة:</u> لا حاجة لإعادة تحميل الصفحة عند عودة الإنترنت — الموقع سيعاود الاتصال تلقائيًا. إعادة التحميل قد تُبطئ العملية فقط.
          </Text>
        ) : (
          <Text mt={3} color={'gray.700'} fontWeight={'700'}>
            <u>Note:</u> No need to reload the page when the internet is back — the site will reconnect automatically. Reloading may only slow things down.
          </Text>
        )}
    </Flex>
  )
}

export default NoInternet
