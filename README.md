# 🟢 موقع للتواصل الاجتماعي | Social Networking Platform

> **scroll down if you want to see the English version.**

---

<div dir="rtl" align="right">

## 🟢 مقدمة

مرحبًا بك في هذا الموقع للتواصل الاجتماعي!
استخدامه سهل وبديهي، يشبه معظم منصات التواصل المعروفة.

---

### 🌐 رابط الموقع الحي

🔗 **[https://d313oyzovamctv.cloudfront.net](https://d313oyzovamctv.cloudfront.net)**

⚠️ نعتذر عن ضعف الأداء، والسبب هو استخدام باقة قواعد البيانات المجانية حاليًا.

---

### المطور

**الاسم:** عبدالرحمن قربان بارودي  
**الدور:** المطور الوحيد والناشر للكود

---

## 🔑 كيفية البدء

- أنشئ حسابًا جديدًا بسهولة.  
- أو سجّل الدخول إذا كان لديك حساب مسبقًا.

---

## ✨ ما الذي يمكنك فعله؟

-  إنشاء منشورات جديدة.  
-  التعليق على منشورات الآخرين والإعجاب بها.  
-  متابعة المستخدمين المفضلين لديك.  
-  تعديل ملفك الشخصي (الصورة والمعلومات).

---

## 🚀 أبرز الميزات

- واجهة بسيطة وسهلة الاستخدام.  
- **التبديل بين الأوضاع** بالنقر على الشعار في شريط التنقل.  
- **إنشاء منشور أو ريلز** من خلال علامة ➕ أسفل الشاشة.  
- **بحث ذكي**: يمكنك العثور على المستخدمين بجزء من الاسم أو الاسم المستعار.  
- **دردشة متكاملة:**
  - أضف مستخدمًا عبر اسمه المستعار في خانة البحث الخاصة بالدردشات.
  - لتسجيل صوت: نقرة واحدة للتشغيل وأخرى للإيقاف (بدون ضغط مستمر).
  - ابدأ دردشة مباشرة من أي منشور/مقطع/صفحة شخصية عبر قائمة الثلاث نقاط → دردشة.
- **مشاركة سهلة:**
  - انسخ روابط المنشورات أو المقاطع أو الصفحات عبر قائمة الثلاث نقاط → نسخ الرابط.
- **تنزيل الوسائط:**
  - تحميل المقاطع من صفحة الريلز.
  - تحميل الصور/الفيديوهات من المنشورات أو الرسائل عبر أيقونة التنزيل أعلى كل وسائط.
- **إعدادات مرنة:** تغيير اللغة، الوضع، أو تجميد الحساب مؤقتًا.  
- **إشعارات فورية:** عند تلقي الرسائل الجديدة.

---

## 📝 ملاحظات

هذه مجرد لمحة عن أبرز الخصائص.  
اكتشف المزيد بنفسك عند استخدامك للموقع! 🚀

## 🛠️ تشغيل المشروع محليًا

اتبع الخطوات التالية لتشغيل المشروع على جهازك المحلي:

<ol dir="rtl">
    <li>
        قم بتحميل الكود على جهازك. 
    </li>
    ```bash
        git clone https://github.com/Abdurrahman515/ShareX
    ``` 
    <li>
        تأكد من تنزيل الأدوات البرمجية المطلوبة مثل Node.js ومحرر الأكواد.  
    </li>
    <li>
        افتح مجلد المشروع الرئيسي **(وليس مجلدًا فرعيًا)** ثم افتح الطرفية (Terminal).  
    </li>
    <li>
        قم بتنفيذ أمر البناء لتنزيل الحزم المطلوبة:
    </li>
    ```bash
        npm run build
    ```
    <li>
        قم بالذهاب الى الملف التالي والغي التعليق عن مجموعة السطور الموجودة اخر الملف:<br/>
            backend/app.js
    </li>
    <li>
        قم بإنشاء الملف الاتي:<br/>
            backend/.env
        وضع فيه السطور الاتية مع تعديل القيم حسب الحاجة:<br/>
            PORT=5000<br/>
            MONGO_URI=your_mongo_db_connection_string<br/>
            JWT_SECRET=your_jwt_secret_key<br/>
            VAPID_PUBLIC_KEY=your_vapid_public_key<br/>
            VAPID_PRIVATE_KEY=your_vapid_private_key<br/>
            CLOUD_NAME=your_cloud_name<br/>
            API_KEY=your_cloud_api_key<br/>
            API_SECRET=your_cloud_api_secret<br/>
    </li>
    <li>
        ان كنت تريد تشغيل ملفات الاختبار لا تنسى اضافة الملف الاتي مع نفس المتغيرات اعلاه:<br/>
            backend/.env.test
    </li>
    <li>
        قم بتشغيل الخادم من الجذر عن الطريق الامر:
    </li>
    ```bash
        npm start
    ```
    <li>
        افتح متصفحك على العنوان:<br/>
            http://localhost:5000
    </li>
</ol>

</div>

---
---

Welcome to our social networking platform!  
Built with simplicity and ease of use in mind, it provides everything you need to **connect**, **share**, and **engage** with others.

---

### 🌐Live Demo:

🔗 **[https://d313oyzovamctv.cloudfront.net](https://d313oyzovamctv.cloudfront.net)**<br/>

⚠️ we apologize for the performance issues caused by the free-tier database plan currently in use.

---

### Developer

**Name:** Abdurrahman Kurban Baroudi
**Role:** Sole developer and code publisher

---

## 🔑 Getting Started

- **Sign Up:** Create a new account in just a few steps.  
- **Log In:** Access your account if you already have one.

---

## ✨ Core Features

- **Create Content:** Share posts and short videos (Reels).  
- **Engage with Others:** Like and comment on posts.  
- **Follow Users:** Stay updated with people you care about.  
- **Personalize Your Profile:** Update your picture and personal information.

---

## 🚀 Unique Highlights

- **Clean UI:** Simple and user-friendly interface.  
- **Display Mode Toggle:** Instantly switch between modes by clicking the logo in the navigation bar.  
- **Quick Post Creation:** Use the ➕ button at the bottom of the screen to create posts or Reels.  
- **Smart Search:** Find users even if you only remember part of their name or username.

---

### 💬 Integrated Chat

- Add users by searching for their username in the chat section.  
- To record an audio clip, tap once to start and tap again to stop — no need to press and hold the microphone icon.  
- Start a conversation directly from any post, reel, or profile page via the three-dot menu → **Chat**.  

---

### 🔗 Easy Sharing

- Copy links to posts, Reels, or profile pages using the three-dot menu → **Copy Link**.

---

### ⬇️ Easy Download

- Download any Reel from the Reels page via the three-dot menu → **Download**.  
- Download any image/video from posts or messages by clicking the download icon located at the top corner of each video/image.  

---

### ⚙️ Flexible Settings

- Switch display modes, change languages, or freeze your account temporarily.  

---

### 🔔 Instant Notifications

- Receive real-time alerts when new messages arrive. 

---

## 📝 Notes

This README covers the main features — there’s plenty more waiting for you to explore! 

---

## 🛠️ Local Setup

Follow these steps to run the project on your local machine:

1. Download the code to your device.<br/>
    ```bash
        git clone https://github.com/Abdurrahman515/ShareX
    ```

2. Ensure you have the necessary tools installed, such as a code editor.

3. Open the main project folder (not any subfolder) and launch the terminal.

4. Run the build command from the root to install required packages:<br/>
    ```bash
        npm run build
    ```

5. Navigate to the following file and uncomment the lines at the end of the file:<br/>
    backend/app.js

6. Create the following file:<br/>
    backend/.env

   Add the following lines, adjusting values as needed:<br/>
    PORT=5000<br/>
    MONGO_URI=your_mongo_db_connection_string<br/>
    JWT_SECRET=your_jwt_secret_key<br/>
    VAPID_PUBLIC_KEY=your_vapid_public_key<br/>
    VAPID_PRIVATE_KEY=your_vapid_private_key<br/>
    CLOUD_NAME=your_cloud_name<br/>
    API_KEY=your_cloud_api_key<br/>
    API_SECRET=your_cloud_api_secret<br/>

7. If you want to run test files, don’t forget to create the following file with the same variables as above:<br/>
    backend/.env.test



8. Start the server from the root using the command:<br/>
    ```bash
        npm start
    ```
9. Open your browser and go to:<br/>
    http://localhost:5000