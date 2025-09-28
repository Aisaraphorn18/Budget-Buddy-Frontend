"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./stylee.css";

export default function Register() {
  const [firstName, setfirstName] = useState("");
  const [lastName, setlastName]   = useState("");
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !firstName || !lastName) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:4000/api/v1/auth/register", {
        first_name: firstName,
        last_name:  lastName,
        username,
        password,
      });
      router.push("/Login");
    } catch (err) {
      if (err?.response?.status === 409 || err?.response?.status === 401) {
        setError("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
      } else {
        setError(err?.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Background">
      <div className="container">
        <img src="/Logo.png" alt="Logo" className="logo" />
        <p className="title">Budget Buddy</p>

        <form onSubmit={handleLogin}>
          <div className="row-2">
            <div className="field">
              <label className="label" htmlFor="firstname">Firstname</label>
              <div className="box-input">
                <input
                  id="firstname"
                  className="input"
                  placeholder="Wandee"
                  value={firstName}
                  onChange={(e) => { setfirstName(e.target.value); setError(""); }}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="lastname">Lastname</label>
              <div className="box-input">
                <input
                  id="lastname"
                  className="input"
                  placeholder="Meejai"
                  value={lastName}
                  onChange={(e) => { setlastName(e.target.value); setError(""); }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="user">Username</label>
            <div className="box-input has-icon-left">
              <img src="/user.png" alt="user" className="icon-left" />
              <input
                id="user"
                className="input with-left"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="pass">Password</label>
            <div className="box-input has-icon-left has-icon-right">
              <img src="/password.png" alt="lock" className="icon-left" />
              <input
                id="pass"
                type={showPassword ? "text" : "password"}
                className="input with-left with-right"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
              <button
                type="button"
                className="icon-button icon-right"
                onClick={() => setShowPassword(v => !v)}
                aria-label="toggle password"
              >
                <img
                  src={showPassword ? "/eye.png" : "/eyeclose.png"}
                  alt="toggle password"
                  className="iconeye"
                />
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "กำลังลงทะเบียน..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}