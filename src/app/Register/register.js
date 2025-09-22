"use client";
import { useState,useEffect } from "react";

import "./stylee.css";

export default function Register() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="Background">
      <div className="container">
        <img src="/Logo.png" alt="Logo" className="logo" />
        <p className="title">Budget Buddy</p>

        {/* Name row: 2 columns */}
        <div className="row-2">
          <div className="field">
            <label className="label" htmlFor="firstname">Firstname</label>
            <div className="box-input">
              <input id="firstname" className="input" placeholder="Wandee" />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="lastname">Lastname</label>
            <div className="box-input">
              <input id="lastname" className="input" placeholder="Meejai" />
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="field">
          <label className="label" htmlFor="user">Username</label>
          <div className="box-input has-icon-left">
            <img src="/user.png" alt="user" className="icon-left" />
            <input id="user" className="input with-left" placeholder="Username" />
          </div>
        </div>

        {/* Password */}
        <div className="field">
          <label className="label" htmlFor="pass">Password</label>
          <div className="box-input has-icon-left has-icon-right">
            <img src="/password.png" alt="lock" className="icon-left" />
            <input
              id="pass"
              type={showPass ? "text" : "password"}
              className="input with-left with-right"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="icon-button icon-right"
              onClick={() => setShowPass(v => !v)}
              aria-label="toggle password visibility"
              title="Show/Hide password"
            >
              <img src="/eye.png" alt="eye" />
            </button>
          </div>
        </div>

        <button className="btn">Register</button>
      </div>
    </div>
  );
}
