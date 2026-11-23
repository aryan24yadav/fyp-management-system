import axios from "axios";

// Configure per environment in client/.env (see client/.env.example).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 60000,
});

/**
 * Extracts a readable message from an axios error. Works for network errors
 * too (no `error.response`), where `error.response.data.message` used to
 * throw a TypeError inside the catch block.
 */
export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

/**
 * Same as getErrorMessage for requests made with responseType "blob": the
 * server's JSON error body arrives as a Blob and has to be parsed first.
 */
export const getBlobErrorMessage = async (error, fallback) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch {
      /* not JSON: fall through */
    }
  }
  return getErrorMessage(error, fallback);
};
