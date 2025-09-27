import webPush from 'web-push';

webPush.setVapidDetails(
    'mailto:karbanbaroudia@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

