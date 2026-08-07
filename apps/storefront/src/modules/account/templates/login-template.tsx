"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="mx-auto flex w-full max-w-md justify-center rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-5 py-7 shadow-[var(--hp-shadow-card)] sm:px-8 sm:py-9">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
