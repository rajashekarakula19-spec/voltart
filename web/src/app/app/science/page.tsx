import { redirect } from "next/navigation";

/** Old DS route → Forecast */
export default function ScienceRedirect() {
  redirect("/app/forecast");
}
