export const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "IT"];

/** Department options, keeping a stored value that is not in the default list. */
export const departmentOptions = (current) =>
  current && !DEPARTMENTS.includes(current)
    ? [...DEPARTMENTS, current]
    : DEPARTMENTS;
