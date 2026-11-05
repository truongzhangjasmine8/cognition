"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setCurrentUser } from "./auth";

export async function switchUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  if (id) await setCurrentUser(id);
  revalidatePath("/", "layout");
  // Land on the home page so a 403 rendered for the previous user is not left on screen.
  redirect("/");
}
