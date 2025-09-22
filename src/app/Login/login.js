import Link from "next/link";

import "./login.css";

export default function Login() {
  return (
    <div className="Background">
      <div className="container">
        <img src="/Logo.png" alt="Logo-pig" className="logo" />
        <p className="title">Budget Buddy</p>

        <div className="field">
          <label className="label" htmlFor="user">Username</label>
          <div className="box-input">
            <img src = "/user.png" alt = "iconuser" className="iconuser"/>
            <input id="user" className="input" placeholder="Somchai" />
          </div>
        </div>

        <div className="field">
            <label className="label" htmlFor="pass">Password</label>
            <div className="box-input">
                <img src="/password.png" alt="iconpassword" className="iconpassword" />
                <input id="pass" type="password" className="input" placeholder="••••••••" />
                <img src="/eye.png" alt="iconeye" className="iconeye" />
            </div>
            <Link href="/Register" >
              <span className="Register">Register</span>
            </Link>
            
        </div>


        <button className="btn">เข้าสู่ระบบ</button>
      </div>
    </div>
  );
}
