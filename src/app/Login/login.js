"use client";
import "./login.css";
import Link from "next/link";
import axios from "axios";
import { useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setshowPassword] = useState(false);
  const router = useRouter();

  // ✅ รีเซ็ตธีมและ header ทุกครั้งที่เข้าหน้า Login
  useLayoutEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/v1/auth/login", {
        username,
        password,
      });

      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      router.push("/Home");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Background">
      <div className="container">
        <img src="/Logo.png" alt="Logo-pig" className="logo" />
        <p className="title">Budget Buddy</p>

        <div className="field">
          <label className="label" htmlFor="user">Username</label>
          <div className="box-input">
            <img src="/user.png" alt="iconuser" className="iconuser" />
            <input
              id="user"
              className="input"
              placeholder="Somchai"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="pass">Password</label>
          <div className="box-input">
            <img src="/password.png" alt="iconpassword" className="iconpassword" />
            <input
              id="pass"
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn-eye"
              onClick={() => setshowPassword(!showPassword)}
            >
              <img
                src={showPassword ? "/eye.png" : "/eyeclose.png"}
                alt="toggle password"
                className="iconeye"
              />
            </button>
          </div>
          <Link href="/Register">
            <span className="Register">Register</span>
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        <button
          className="btn"
          type="submit"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
