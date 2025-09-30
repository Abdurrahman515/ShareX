import { Text } from '@chakra-ui/react';
import Autolinker from 'autolinker';
import DOMPurify from 'dompurify';
import React from 'react';

const MessageText = ({ text, color }) => {
    if (!text) return null;

    const isInnerUrl = text.includes('d313oyzovamctv.cloudfront.net')

    const autolinked = Autolinker.link(text, {
        urls: true,
        email: true,
        phone: true,
        mention: false,
        hashtag: false,
        stripPrefix: false,
        newWindow: isInnerUrl ? false : true,
    });

    const sanitized = DOMPurify.sanitize(autolinked, {
        ALLOWED_TAGS: ["a", "b", "i", "em", "strong", "u", "br", "span"],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });

    const ensureTargetRel = sanitized.replace(/<a /g, '<a rel="noopener noreferrer" ');

    return (
        <Text 
            className='chat-message'
            color={color}
            p={0} 
            m={0}
            whiteSpace={'pre-wrap'}
            overflowWrap={'anywhere'}
            wordBreak={"break-word"}
            hyphens={'auto'}
            dangerouslySetInnerHTML={{ __html: ensureTargetRel }}
        />
    )
}

export default MessageText
