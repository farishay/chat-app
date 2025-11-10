// ---------------- IMPORTS ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildChanged,
  update,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyDFFe4WtyyfssSogETqXEiyIKJTOA2ojbM",
  authDomain: "chat-app-ac2c7.firebaseapp.com",
  databaseURL: "https://chat-app-ac2c7-default-rtdb.firebaseio.com",
  projectId: "chat-app-ac2c7",
  storageBucket: "chat-app-ac2c7.firebasestorage.app",
  messagingSenderId: "304037035362",
  appId: "1:304037035362:web:c01f5c25b741fd17ad003b",
  measurementId: "G-WHVVQ84JMF",
};

// ---------------- INITIALIZE APP ----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

// ---------------- SIGN UP ----------------
document.getElementById("signup")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please fill all fields!");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("username", email.split("@")[0]);
    localStorage.setItem("userDp", ""); // ensure no Google image remains
    alert("SignUp Successful!");
    window.location.href = "user.html";
  } catch (err) {
    alert(err.message);
  }
});

// ---------------- LOGIN ----------------
document.getElementById("login")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please fill all fields!");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("username", email.split("@")[0]);
    localStorage.setItem("userDp", ""); // clear any old dp
    alert("Login Successful!");
    window.location.href = "user.html";
  } catch (err) {
    alert(err.message);
  }
});

// ---------------- GOOGLE LOGIN ----------------
document.getElementById("google-btn")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    localStorage.setItem("username", user.displayName || "Anonymous");
    localStorage.setItem("userDp", user.photoURL || "");
    alert("Google Login Successful!");
    window.location.href = "chat.html";
  } catch (err) {
    alert(err.message);
  }
});

// ---------------- LOGOUT ----------------
document.getElementById("logout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    alert("Logged Out!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
});

// logout-2---------------------
document.getElementById("logout-2")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    alert("Logged Out!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
});

// ---------------- USERNAME BUTTON ----------------
document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Please enter username!");
  localStorage.setItem("username", username);
  localStorage.setItem("userDp", ""); // no dp for anonymous user
  window.location.href = "chat.html";
});

// ---------------- REALTIME CHAT ----------------
const username = localStorage.getItem("username") || "Anonymous";
const userDp = localStorage.getItem("userDp")?.trim() || "";
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

// ---------------- SEND MESSAGE ----------------
sendBtn?.addEventListener("click", sendMessage);
messageInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const msgData = {
    user: username,
    dp: userDp,
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    edited: false,
    deleted: false,
  };

  push(messagesRef, msgData);
  messageInput.value = "";
}

// ---------------- RECEIVE MESSAGES ----------------
onChildAdded(messagesRef, (snapshot) => {
  const msg = snapshot.val();
  const key = snapshot.key;
  renderMessage(msg, key);
});

// ---------------- REFLECT UPDATES REALTIME ----------------
onChildChanged(messagesRef, (snapshot) => {
  const msg = snapshot.val();
  const key = snapshot.key;
  const existingMsg = document.querySelector(`[data-key="${key}"]`);
  if (existingMsg) {
    existingMsg.querySelector(".msg-content").textContent = msg.text;
    if (msg.deleted) existingMsg.classList.add("deleted");
  }
});

// ---------------- RENDER MESSAGE ----------------
function renderMessage(msg, key) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(msg.user === username ? "sent" : "received");
  div.dataset.key = key;

  // --- Generate initials safely ---
  let initials = "A";
  if (msg.user && typeof msg.user === "string") {
    const parts = msg.user.trim().split(" ");
    if (parts.length === 1) initials = parts[0][0]?.toUpperCase() || "A";
    else initials = (parts[0][0] + parts[1][0])?.toUpperCase();
  }

  const hasValidDp = msg.dp && msg.dp !== "null" && msg.dp.trim() !== "";

  div.innerHTML = `
    <div class="msg-top">
      ${
        hasValidDp
          ? `<img src="${msg.dp}" class="user-dp-small" alt="dp">`
          : `<span class="user-initials">${initials}</span>`
      }
      <span class="msg-user">${msg.user}</span>
      <span class="msg-time">${msg.time}</span>
    </div>
    <div class="msg-content">${msg.text}</div>
    ${
      msg.user === username
        ? `<div class="msg-actions">
            <button class="edit" title="Edit">✏️</button>
            <button class="delete" title="Delete">🗑️</button>
          </div>`
        : ""
    }
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (msg.user === username) {
    div
      .querySelector(".edit")
      ?.addEventListener("click", () => editMessage(key));
    div
      .querySelector(".delete")
      ?.addEventListener("click", () => deleteMessage(key));
  }
}

// ---------------- EDIT MESSAGE ----------------
function editMessage(key) {
  const msgNode = document.querySelector(`[data-key="${key}"] .msg-content`);
  const currentText = msgNode.textContent.replace(" (edited)", "");
  const newText = prompt("Edit message:", currentText);
  if (!newText || newText === currentText) return;

  update(ref(db, "messages/" + key), {
    text: newText + " (edited)",
    edited: true,
  });
}

// ---------------- DELETE MESSAGE ----------------
function deleteMessage(key) {
  const confirmDelete = confirm("Delete this message?");
  if (!confirmDelete) return;

  update(ref(db, "messages/" + key), {
    text: "🚫 Message deleted",
    deleted: true,
  });
}

// ---------------- THEME TOGGLE ----------------
const themeToggle = document.getElementById("themeToggle");
themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.classList.toggle("active");
});

// ---------------- DARK MODE CSS ----------------
const darkStyle = document.createElement("style");
darkStyle.innerHTML = `
  .dark-mode {
    background: #1a1a1a;
    color: white;
  }
  .dark-mode .chat-container {
    background: #2c2c2c;
  }
  .dark-mode #messageInput {
    background: #3a3a3a;
    color: white;
    border-color: #666;
  }
  .dark-mode .message {
    background: #444;
    color: white;
  }
  .user-initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #795548;
    color: #fff;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    margin-right: 6px;
  }
  .user-dp-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 6px;
  }
`;
document.head.appendChild(darkStyle);
