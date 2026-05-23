# Setting up your Firebase project

This connects the dashboard to **your own** Firebase project, so your finance data lives in your Google account and nobody else — not even the app's author — can read it.

- **Time:** ~10 minutes
- **You need:** a Google account
- **Cost:** free (see the free-tier limits at the end)

> 💡 **The one step people skip:** Step 3 (publishing security rules). If you skip it, the app will connect and *look* fine, but **your data silently won't save**. Don't skip Step 3.

After each step there's a **✅ What you should see** so you can confirm it worked before moving on.

---

## Step 1 — Create a Firebase project

1. Go to <https://console.firebase.google.com>
2. Click **Add project** (or **Create a project**).
3. Give it any name (e.g. `my-finance`).
4. On the Analytics screen, you can **disable Google Analytics** — it's not needed.
5. Click **Create project**, wait for it to finish, then **Continue**.

✅ **What you should see:** your new project's dashboard ("Project Overview").

---

## Step 2 — Create the Firestore database

⚠️ This app uses **Cloud Firestore**, *not* "Realtime Database". Make sure you pick the right one.

1. In the left sidebar, open **Firestore Database**. (Can't find it? Type "Firestore" in the console's **search bar** at the top — the sidebar grouping changes between console versions.)
2. Click **Create database**.
3. Choose a **location/region** close to you (you can't change this later).
4. Select **Production mode** → **Next/Create**.

> **Why this matters:** "Production mode" starts with rules that **deny all access**. That's intentional — you'll open it up to *only you* in the next step. Until you do Step 3, every read and write is blocked.

✅ **What you should see:** an empty Firestore data viewer with **(default)** as the database, and a **Rules** tab at the top.

---

## Step 3 — ⚠️ Publish the security rules (do not skip)

This is the step that makes saving actually work. It locks your data so only *you* (signed in with your Google account) can read or write it.

1. In Firestore, click the **Rules** tab.
2. Select everything in the editor and delete it.
3. Paste this **exactly**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **Publish** (top of the editor).

> **What these rules do:** the app stores your data at `users/{your-uid}/data/...`. The rule allows access only when the signed-in user's ID matches that path — so each person can reach their own data and no one else's.

✅ **What you should see:** a "Rules published" / "successfully deployed" confirmation, and the editor no longer shows unsaved changes. (If it still says `allow read, write: if false;` anywhere, the deny-all default is still active — re-paste and Publish again.)

---

## Step 4 — Enable Google sign-in

1. In the left sidebar, open **Authentication** → **Get started**. (Can't find it? Type "Authentication" in the console's **search bar** at the top.)
2. Open the **Sign-in method** tab.
3. Click **Google** → toggle **Enable**.
4. Pick a **support email** → **Save**.

✅ **What you should see:** Google listed as **Enabled** under Sign-in providers.

---

## Step 5 — Authorize the app's domain

`localhost` is authorized automatically, so local development works out of the box. But to sign in on the **hosted dashboard**, you must also authorize the domain it runs on — otherwise sign-in fails there with `auth/unauthorized-domain`.

1. **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter the hosted domain — **exactly this**, with no `https://`, no path, and no trailing slash:

   ```
   renjith-noel-raj.github.io
   ```

   > Running your own copy somewhere else instead? Add *that* domain (e.g. `myfinance.netlify.app`). The rule of thumb: authorize the **hostname in your browser's address bar** when you use the app.

✅ **What you should see:** `renjith-noel-raj.github.io` in the authorized list (alongside `localhost`).

---

## Step 6 — Get your config

1. Click the **gear icon** (top-left) → **Project settings**.
2. Scroll to **Your apps** → click the **web icon** `</>`.
3. Register the app (any nickname; you do **not** need Firebase Hosting).
4. Copy the **`firebaseConfig`** object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

> The `apiKey` here is **not a secret** — Firebase web config is meant to ship in client code. Your data is protected by the rules from Step 3, not by hiding this.

✅ **What you should see:** the `firebaseConfig` block on screen, ready to copy.

---

## Step 7 — Connect the dashboard

1. Open the dashboard and choose **Firebase**.
2. Paste the config (you can paste the whole `{ ... }` object — quoted or unquoted keys both work).
3. Click **Connect Firebase**.
4. Click **Sign in with Google** and pick your account.

✅ **What you should see:** the main dashboard, with **"Signed in as you@example.com"** in the header.

---

## Verify it's actually working

1. Add an expense in the app.
2. Open the browser console (**F12** / Cmd+Option+I → **Console**). You should see **no** lines starting with `[PF] Firestore ... failed`.
3. In the Firebase Console: **Firestore → Data** → expand **users → (your id) → data → expenses**. Your entry should be inside the **`value`** field.

If all three check out, you're done. 🎉

---

## Troubleshooting

### "Data isn't saving" / `Missing or insufficient permissions`
**Cause:** Step 3 rules weren't published (the production-mode deny-all is still active). This is by far the most common problem.
**Fix:** Redo **Step 3** and click **Publish**. To confirm it's the cause, open the browser console while adding an entry — a red `permission-denied` error means the rules are blocking you.

### I can't find my data in the console
- Make sure you're looking at **Firestore Database**, not **Realtime Database**.
- Make sure you're in the **same project** whose config you pasted (check the project name top-left).
- Data is stored as **one document per type** (`expenses`, `incomes`, …), each under **users → your-uid → data**. The actual records live inside the document's **`value`** field — you won't see one row per transaction.
- Not sure which `uid` is yours? **Authentication → Users** shows the User UID for your email.

### "JSON Parse error" when pasting the config
**Fix:** paste the **entire** object including the `{` and `}`. Both the quoted-JSON form and the unquoted form Firebase gives you (`apiKey: "..."`) are accepted.

### Google sign-in popup closes / nothing happens
- Allow pop-ups for the site in your browser.
- Confirm **Google** is **Enabled** (Step 4).
- On a deployed site, confirm the domain is in **Authorized domains** (Step 5).

### I want to start over / switch projects
Click the **logout icon** in the header → confirm **"Switch to a different setup?"**. This clears your saved settings (storage choice + config) but **leaves your data in Firestore**. You can then paste a different config.

---

## Is it really free?

Yes, for personal use. Firestore's free **Spark** plan includes **50,000 reads/day**, **20,000 writes/day**, and **1 GiB** of storage — and since each person uses their own project, that quota is all yours. This app's footprint is tiny (a few KB; one write per entry you add), so you'll essentially never leave the free tier. Latest limits: <https://firebase.google.com/pricing>

Your data lives in your Firebase project. No one else can access it.
