import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import SetupPassword from "./SetupPassword.jsx";
import QuantDiverSite from "./QuantDiverSite.jsx";
import { supabase } from "./supabaseClient.js";
import "./index.css";

function Root() {
  const [session,   setSession]   = useState(undefined); // undefined = loading
  const [isSetup,   setIsSetup]   = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if this is a password setup link from invite email
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      setIsSetup(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsSetup(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // loading

  if (isSetup)    return <SetupPassword onDone={() => setIsSetup(false)} />;
  if (!session && showLogin) return <Login onLogin={setSession} onBack={() => setShowLogin(false)} />;
  if (!session)   return <QuantDiverSite onEnterApp={() => setShowLogin(true)} />;
  return <App session={session} onLogout={() => { setSession(null); setShowLogin(false); }} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
