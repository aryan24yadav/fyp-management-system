import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddStudent from "../../components/modal/AddStudent";
import {
  getAllUsers,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../../store/slices/adminSlice";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Plus,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { toggleCreateStudentModal } from "../../store/slices/popupSlice";

const ManageStudents = () => {
  const { users, projects } = useSelector((state) => state.admin);
  const { isCreateStudentModalOpen } = useSelector((state) => state.popup);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
  });

  const dispatch = useDispatch();

  const students = useMemo(() => {
    const Studentsusers = (users || []).filter((u) => u?.role === "Student");

    return Studentsusers.map((student) => {
      const studentsProject = (projects || []).find(
        (p) => p.student?._id === student._id,
      ); // fix projects.find(p => p.student === student._id)

      return {
        ...student,
        projectTitle: studentsProject?.title || null,
        supervisor: studentsProject?.supervisor || null,
        projectStatus: studentsProject?.status || null,
      };
    });
  }, [users, projects]);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const departments = useMemo(() => {
    const set = new Set(
      (students || []).map((s) => s.department).filter(Boolean),
    );
    return Array.from(set);
  }, [students]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterDepartment === "all" || student.department === filterDepartment;
    return matchesSearch && matchesFilter;
  });

  const handleClosedModal = () => {
    setEditingStudent(null);
    setShowModal(false);
    setFormData({
      name: "",
      email: "",
      department: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      dispatch(updateStudent({ id: editingStudent._id, data: formData }));
    }
    handleClosedModal();
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      department: student.department,
    });
    setShowModal(true);
  };

  const handleDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      dispatch(deleteStudent(studentToDelete._id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card header flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="card-title">Manage Students</h1>
              <p className="card-subtitle">Add,Edit and Manage your students</p>
            </div>

            <button
              onClick={() => dispatch(toggleCreateStudentModal())}
              className="btn-primary flex items-center space-x-2 mt-4 md:mt-0 "
            >
              <Plus className="w-5 h-5" />
              <span>Add New Student</span>
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  completed projects
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {
                    students.filter((s) => s.projectStatus === "completed")
                      .length
                  }{" "}
                  {/*s.status === "Completed"*/} fix
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TriangleAlert className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-lg font-semibold text-gray-800">
                  {students.filter((s) => !s.supervisor).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
              />
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter Status
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Student table */}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Students List</h2>
          </div>
          <div className="overflow-x-auto">
            {filteredStudents && filteredStudents.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider  ">
                      <span className="">Student Info</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Department & Year
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Project Title
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Supervisor
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredStudents.map((student) => {
                    return (
                      <tr key={student._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {student.email}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 white-space-nowrap">
                          <div className="text-sm text-slate-900">
                            {student.department || "-"}
                          </div>
                          <div className="text-sm text-slate-500">
                            {student.createdAt
                              ? new Date(student.createdAt).getFullYear()
                              : "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 white-space-nowrap">
                          {student.supervisor ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full
                      text-green-800 bg-gray-100 text-xs font-medium"
                            >
                              {
                                users?.find(
                                  (user) => user._id === student?.supervisor,
                                )?.name
                              }
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full
                      text-red-800 bg-red-100 text-xs font-medium"
                            >
                              {student.projectStatus === "rejected"
                                ? "Rejected"
                                : "Not Assigned"}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text slate-900">
                            {student.projectTitle}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(student)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              filteredStudents.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No students found matching your criteria.
                </div>
              )
            )}
          </div>

          {/* Edit Student Modal */}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Edit Student
                  </h3>
                  <button
                    onClick={handleClosedModal}
                    className="text-slate-400 hover:to-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="input-field w-full py-1 border-b border-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="input-field w-full py-1 border-b border-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                      className="input-field w-full py-1 border-b border-slate-600 focus:outline-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClosedModal}
                      className="btn-danger"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update Student
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDeleteModal && studentToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center mb-4 ">
                  <div
                    className="flex-shrink-0 w-10 h-10 max-auto flex items-center justify-center
                rounded-full bg-red-100"
                  >
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Delete Student
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Are you sure you want to delete{" "}
                    <span>
                      {studentToDelete.name}? This action cannot be undone.
                    </span>
                  </p>

                  <div className="flex justify-center space-x-3">
                    <button onClick={cancelDelete} className="btn-secondary">
                      Cancel
                    </button>
                    <button onClick={confirmDelete} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Student Modal */}
          {isCreateStudentModalOpen && <AddStudent />}
        </div>
      </div>
    </>
  );
};

export default ManageStudents;
