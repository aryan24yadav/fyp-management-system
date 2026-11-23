/** Dashboard home path for a user role. */
export const getHomePath = (role) =>
  role === "Admin" ? "/admin" : role === "Teacher" ? "/teacher" : "/student";
