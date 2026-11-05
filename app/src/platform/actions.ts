"use server";

import { revalidatePath } from "next/cache";
import { setCurrentUser } from "./auth";

export async function switchUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  if (id) await setCurrentUser(id);
  revalidatePath("/", "layout");
}
