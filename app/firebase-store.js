// Kopling mot Firebase: innlogging med e-post og lagring i Firestore (users/{uid}).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVuWytRz1Q-oUz-UiSxrXUmFyxflYIkzI",
  authDomain: "pengeflytstudio-7a0d7.firebaseapp.com",
  projectId: "pengeflytstudio-7a0d7",
  storageBucket: "pengeflytstudio-7a0d7.firebasestorage.app",
  messagingSenderId: "246478319850",
  appId: "1:246478319850:web:4d71dffcac147143f6a793",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "no"; // e-postar frå Firebase (t.d. nytt passord) på norsk
const db = getFirestore(app);
const userDoc = uid => doc(db, "users", uid);

window.PF_STORE = {
  onAuth: cb => onAuthStateChanged(auth, cb),
  signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
  signUp: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
  reset: email => sendPasswordResetEmail(auth, email),
  signOut: () => signOut(auth),
  get email() { return auth.currentUser ? auth.currentUser.email : ""; },
  get uid() { return auth.currentUser ? auth.currentUser.uid : null; },
  get verified() { return !!(auth.currentUser && auth.currentUser.emailVerified); },
  // Stadfesting av e-post: lenkja i e-posten sender brukaren tilbake til appen.
  sendVerify: () => sendEmailVerification(auth.currentUser, { url: location.origin + location.pathname }),
  async refresh() {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true); // ny token, så databasereglane ser at e-posten er stadfesta
    return auth.currentUser.emailVerified;
  },
  async load() {
    const snap = await getDoc(userDoc(auth.currentUser.uid));
    return snap.exists() ? snap.data() : null;
  },
  save: data => setDoc(userDoc(auth.currentUser.uid), data),
  async deleteAccount(password) {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
    await deleteDoc(userDoc(u.uid));
    await deleteUser(u);
  },
};
window.dispatchEvent(new Event("pf-store-ready"));
