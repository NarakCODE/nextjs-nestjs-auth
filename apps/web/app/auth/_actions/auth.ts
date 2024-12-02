"use server";

import { BACKEND_URL } from "@/lib/constants";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SignupFormSchema } from "schemas/SignupFormSchema";

export async function signUpAction(formData: FormData) {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    throw new Error("Missing required fields. Please fill out all fields.");
  }

  const parsedData = SignupFormSchema.safeParse({ name, email, password });

  if (!parsedData.success) {
    throw new Error(parsedData.error.message);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedData.data),
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.message || response.statusText); // Re-throw the error from the backend
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during signup:", error.message);
      throw new Error(`Signup failed: ${error.message}`);
    }

    // Fallback for non-Error instances
    throw new Error("An unexpected error occurred during signup");
  }
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  // Enhanced validation
  if (!email) {
    throw new Error("Invalid email format");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Authentication failed");
    }

    // Secure session creation
    await createSession({
      user: {
        id: responseData.id,
        name: responseData.name,
      },
    });

    return responseData;
  } catch (error) {
    console.error("Signin error:", error);
    throw new Error("Authentication failed. Please check your credentials.");
  }
}
