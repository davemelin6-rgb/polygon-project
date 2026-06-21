import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.jsx";
import Login from "./Login.jsx";
import SetupPassword from "./SetupPassword.jsx";
import QuantDiverSite from "./QuantDiverSite.jsx";
import AdminPanel from "./AdminPanel.jsx";
import { supabase } from "./supabaseClient.js";
import "./index.css";

inject();

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

function Root() {
  const [session,    setSession]   = useState(undefined); // undefined = loading
  const [isSetup,    setIsSetup]   = useState(false);
  const [showLogin,  setShowLogin] = useState(false);
  const [loginMode,  setLoginMode] = useState("signin");
  const [loginPlan,  setLoginPlan] = useState("pro");
  const [showAdmin,  setShowAdmin] = useState(false);

  const ADMIN_EMAIL = "davemelin6@gmail.com";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked a password reset link — show the set-password screen
        setSession(session);
        setIsSetup(true);
      } else if (event === "USER_UPDATED") {
        // Password was successfully updated — go to the app
        setSession(session);
        setIsSetup(false);
      } else {
        setSession(session);
        setIsSetup(false);
      }
    });

    // Fallback for invite links which use a different hash format
    const hash = window.location.hash;
    if (hash.includes("type=invite")) {
      setIsSetup(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    if (!session) return;

    let timer = setTimeout(() => {
      supabase.auth.signOut();
      setSession(null);
      setShowLogin(false);
    }, INACTIVITY_MS);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        supabase.auth.signOut();
        setSession(null);
        setShowLogin(false);
      }, INACTIVITY_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [session]);

  if (session === undefined) return null; // loading

  if (isSetup)    return <SetupPassword onDone={() => setIsSetup(false)} />;
  if (!session && showLogin) return <Login initialMode={loginMode} initialPlan={loginPlan} onLogin={setSession} onBack={() => setShowLogin(false)} />;
  if (!session)   return <QuantDiverSite onEnterApp={(mode, plan) => { setLoginMode(mode || "signin"); setLoginPlan(plan || "pro"); setShowLogin(true); }} />;
  if (showAdmin && session?.user?.email === ADMIN_EMAIL)
    return <AdminPanel session={session.user ? session : { ...session, user: session }} onBack={() => setShowAdmin(false)} />;
  return <App session={session} onLogout={() => { setSession(null); setShowLogin(false); }} onAdmin={session?.user?.email === ADMIN_EMAIL ? () => setShowAdmin(true) : null} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
