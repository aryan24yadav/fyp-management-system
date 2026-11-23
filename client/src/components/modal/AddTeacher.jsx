import { X } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { createTeacher } from "../../store/slices/adminSlice.js";
import { toggleCreateTeacherModal } from "../../store/slices/popupSlice.js";
import { DEPARTMENTS } from "../../lib/constants.js";

// department/experties used to start as "" while the <select> displayed
// "Computer Science", so submitting without touching them failed with
// "All fields are required".
const initialForm = {
  name: "",
  email: "",
  department: DEPARTMENTS[0],
  password: "",
  experties: "",
  maxStudents: 1,
};

const AddTeacher = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const close = () => dispatch(toggleCreateTeacherModal());

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await dispatch(
      createTeacher({ ...formData, maxStudents: Number(formData.maxStudents) }),
    );
    setIsSaving(false);
    if (createTeacher.fulfilled.match(result)) {
      setFormData(initialForm);
      close();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Add Teacher
            </h3>
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleCreateTeacher} className="space-y-4">
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
                maxLength={30}
                required
                className="input-field w-full"
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
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
                required
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
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
                className="input-field w-full"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expertise (comma separated)
              </label>
              <input
                type="text"
                value={formData.experties}
                onChange={(e) =>
                  setFormData({ ...formData, experties: e.target.value })
                }
                placeholder="e.g. Machine Learning, Web Development"
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                max={50}
                min={1}
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({ ...formData, maxStudents: e.target.value })
                }
                required
                className="input-field w-full"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={close} className="btn-danger">
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Adding..." : "Add Teacher"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTeacher;
