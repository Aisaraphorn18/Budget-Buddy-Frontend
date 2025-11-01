import Login from "@/app/Login/page";
import { fetchCsrfToken } from "./lib/axiosClient";

export default async function Home() {
  await fetchCsrfToken();
  return (
    <div>
      <Login />
    </div>
  );
}
