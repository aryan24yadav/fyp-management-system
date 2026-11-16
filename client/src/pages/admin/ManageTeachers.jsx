import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Addstudent from "../../components/modal/AddTeacher";
import {
  deleteTeacher,
  getAllUsers,
  updateTeacher,
} from "../../store/slices/adminSlice";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle,
  Plus,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import AddTeacher from "../../components/modal/AddTeacher";

const ManageTeachers = () => {
  const { users } = useSelector((state) => state.admin);
  const { isCreateTeacherModalOpen } = useSelector((state) => state.popup);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    experties: "",
    maxStudents: 10,
  });

  const dispatch = useDispatch();

  const teachers = useMemo(() => {
    return (users || []).filter((u) => u?.role?.toLowerCase() === "teacher");
  }, [users]);

  const departments = useMemo(() => {
    const set = new Set(
      (teachers || []).map((t) => t.department).filter(Boolean),
    );
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      (teacher.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterDepartment === "all" || teacher.department === filterDepartment;
    return matchesSearch && matchesFilter;
  });

  const handleClosedModal = () => {
    setEditingTeacher(null);
    setShowModal(false);
    setFormData({
      name: "",
      email: "",
      department: "",
      experties: "",
      maxStudents: 10,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTeacher) {
      dispatch(updateTeacher({ id: editingTeacher._id, data: formData }));
    }
    handleClosedModal();
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
      experties: Array.isArray(teacher.experties)
        ? teacher.experties[0]
        : teacher.experties,
      maxStudents:
        typeof teacher.maxStudents === "number" ? teacher.maxStudents : 10,
    });
    setShowModal(true);
  };

  const handleDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      dispatch(deleteTeacher(teacherToDelete._id));
      setShowDeleteModal(false);
      setTeacherToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card header flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="card-title">Manage Teachers</h1>
              <p className="card-subtitle">Add,Edit and Manage your Teachers</p>
            </div>

            <button
              onClick={() => dispatch(toggleCreateTeacherModal())} // fix dispatch(toggleTeacherModal())
              className="btn-primary flex items-center space-x-2 mt-4 md:mt-0 "
            >
              <Plus className="w-5 h-5" />
              <span>Add New Teacher</span>
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
                  Total Teachers
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {teachers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BadgeCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Assigned Students
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {teachers.reduce(
                    (sum, t) => sum + (t.assignedStudents?.length || 0),
                    0,
                  )}
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
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-lg font-semibold text-gray-800">
                  {departments.length}
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

        {/* Teachers table */}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Teachers List</h2>
          </div>
          <div className="overflow-x-auto">
            {filteredTeachers && filteredTeachers.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider  ">
                      <span className="">Teacher Info</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Department
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Join Date
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Expertise
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
                  {filteredTeachers.map((teacher) => {
                    return (
                      <tr key={teacher._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {teacher.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {teacher.email}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 white-space-nowrap">
                          <div className="text-sm text-slate-900">
                            {teacher.department || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 white-space-nowrap">
                          {Array.isArray(teacher.experties)
                            ? teacher.experties.join(", ")
                            : teacher.experties}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text slate-900">
                            {teacher.createdAt
                              ? new Date(teacher.createdAt).toLocaleDateString()
                              : "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(teacher)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(teacher)}
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
              filteredTeachers.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No teachers found matching your criteria.
                </div>
              )
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Edit Teacher
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

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Experties
                    </label>
                    <select
                      value={formData.experties}
                      onChange={(e) =>
                        setFormData({ ...formData, experties: e.target.value })
                      }
                      required
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Students
                    </label>
                    <input
                      type="number"
                      max={10}
                      min={1}
                      value={formData.maxStudents}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxStudents: e.target.value,
                        })
                      }
                      required
                      className="input-field w-full py-1 border-b border-slate-600 focus:outline-none"
                    />
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
                      Update Teacher
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDeleteModal && teacherToDelete && (
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
                    Delete Teacher
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Are you sure you want to delete{" "}
                    <span>
                      {teacherToDelete.name}? This action cannot be undone.
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

          {/* Add Teacher Modal */}
          {isCreateTeacherModalOpen && <AddTeacher />}
        </div>
      </div>
    </>
  );
};

export default ManageTeachers;
