import User from "../models/userModel.js";
import webPush from 'web-push';

const restoreSubscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user._id;
    
        await User.findByIdAndUpdate({ _id: userId }, { $set: {
            "pushSubscription.endpoint": subscription.endpoint, 
            "pushSubscription.keys.auth": subscription.keys.auth, 
            "pushSubscription.keys.p256dh": subscription.keys.p256dh
        }});

        res.status(201).json({ message: 'Subscribed successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message});
        console.log('Error in restoreSubscribe', error.message);
    };
};

const sendNotification = async (req, res) => {
    try {
        const { userId, payload } = req.body;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const user = await User.findById(userId);
        
        if(!user || !user.pushSubscription || !user.pushSubscription.endpoint){
            return res.status(400).json({ error: "User is not subscribed!" });
        };

        webPush.setVapidDetails(
            'mailto:karbanbaroudia@gmail.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        await webPush.sendNotification(user.pushSubscription, JSON.stringify(payload))
            .catch( error => {
                console.log('Error in send notification: ', error)
            });

        res.status(200).json({ message: lang === 'ar' ? "تم إرسال الإشعار!" : 'notification sent!'});
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log('Error in sendNotification Controller', error);
    };
}

export { restoreSubscribe, sendNotification };