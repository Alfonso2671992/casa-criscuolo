// FCM service worker. The server sends `notification` + `fcm_options.link`,
// so the SDK shows the notification and opens the link on tap by itself.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCHPWXCOg3lwu6_okAlpUomiGWoJ7f9he8',
  authDomain: 'casa-criscuolo.firebaseapp.com',
  databaseURL: 'https://casa-criscuolo-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'casa-criscuolo',
  storageBucket: 'casa-criscuolo.firebasestorage.app',
  messagingSenderId: '229191200590',
  appId: '1:229191200590:web:3eacdaa52d32780a40381f',
});

firebase.messaging();
