import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiSave, FiArrowLeft } from "react-icons/fi";
import { useToast } from "../../components/ToastProvider";

export default function MySupProfile() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/suppliers/me");
      setProfile(data);
      setOriginalProfile(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error(err);
      toast.error("Please login to view your profile.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (path, value) => {
    // restrict phone fields to 10 digits only
    if (
      path.includes("phone") &&
      value.length > 10
    ) return;

    setProfile((prev) => {
      const clone = { ...prev };
      const keys = path.split(".");
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
    setErrors((prev) => ({ ...prev, [path]: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Required field validation
    if (!profile.companyName?.trim()) {
      newErrors["companyName"] = "Company name is required.";
    }
    if (!profile.address?.trim()) {
      newErrors["address"] = "Address is required.";
    }
    if (!profile.contactPerson?.name?.trim()) {
      newErrors["contactPerson.name"] = "Contact person name is required.";
    }

    // Email validation
    if (!profile.contactDetails?.email?.trim()) {
      newErrors["contactDetails.email"] = "Email is required.";
    } else if (!emailRegex.test(profile.contactDetails.email)) {
      newErrors["contactDetails.email"] = "Please enter a valid email address.";
    }

    // Phone validation
    if (!profile.contactDetails?.phone?.trim()) {
      newErrors["contactDetails.phone"] = "Phone number is required.";
    } else if (!/^\d{10}$/.test(profile.contactDetails.phone)) {
      newErrors["contactDetails.phone"] = "Phone number must be 10 digits.";
    }

    if (
      profile.contactPerson.phone &&
      !/^\d{10}$/.test(profile.contactPerson.phone)
    ) {
      newErrors["contactPerson.phone"] =
        "Contact person number must be 10 digits.";
    }

    // Bank details validation
    if (!profile.bankAccount?.accountNumber?.trim()) {
      newErrors["bankAccount.accountNumber"] = "Account number is required.";
    }
    if (!profile.bankAccount?.bankName?.trim()) {
      newErrors["bankAccount.bankName"] = "Bank name is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      toast.info("Please fix the errors before saving.");
      return;
    }

    if (!window.confirm("Are you sure you want to save changes?")) return;

    try {
      const { data } = await api.put("/suppliers/me", profile);

      // handle both response structures safely
      const updated = data?.supplier || data;

      setProfile(updated);
      setOriginalProfile(JSON.parse(JSON.stringify(updated)));
      toast.success("Profile updated successfully!");

      // reload from server to reflect real-time data
      await loadProfile();
      setEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  if (loading) return <div className="centered">Loading profile...</div>;
  if (!profile) return null;

  return (
    <div className="supProfileWrapper">
      <div className="profileContainer">
        <div className="headerRow">
          <h2 className="title">My Supplier Profile</h2>
          <button className="backBtn" onClick={() => navigate(-1)}>
            <FiArrowLeft style={{ verticalAlign: "middle", marginRight: 6 }} />
            Back
          </button>
        </div>

        <div className="sectionGrid">
          {/* LEFT COLUMN */}
          <div className="leftColumn">
            <div className="sectionCard">
              <h3>🏢 Company Details</h3>
              <div className="formGrid">
                <div className="formGroup">
                  <label>Company Name <span style={{color: '#ef4444'}}>*</span></label>
                  <input
                    type="text"
                    value={profile.companyName || ""}
                    onChange={(e) =>
                      handleChange("companyName", e.target.value)
                    }
                    disabled={!editMode}
                    style={{
                      borderColor: errors["companyName"] ? '#ef4444' : '',
                      backgroundColor: errors["companyName"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["companyName"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["companyName"]}</span>
                  )}
                </div>

                <div className="formGroup">
                  <label>Address <span style={{color: '#ef4444'}}>*</span></label>
                  <input
                    type="text"
                    value={profile.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    disabled={!editMode}
                    style={{
                      borderColor: errors["address"] ? '#ef4444' : '',
                      backgroundColor: errors["address"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["address"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["address"]}</span>
                  )}
                </div>

                <div className="formGroup">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={profile.branch || ""}
                    onChange={(e) => handleChange("branch", e.target.value)}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </div>

          {/* Bank Info */}
          <div className="sectionCard">
            <h3>💳 Bank Information</h3>
            <div className="formGrid">
              <div className="formGroup">
                <label>Bank Name <span style={{color: '#ef4444'}}>*</span></label>
                <input
                  type="text"
                  value={profile.bankAccount?.bankName || ""}
                  onChange={(e) =>
                    handleChange("bankAccount.bankName", e.target.value)
                  }
                  disabled={!editMode}
                  style={{
                    borderColor: errors["bankAccount.bankName"] ? '#ef4444' : '',
                    backgroundColor: errors["bankAccount.bankName"] ? '#fef2f2' : ''
                  }}
                />
                {errors["bankAccount.bankName"] && (
                  <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["bankAccount.bankName"]}</span>
                )}
              </div>

              <div className="formGroup">
                <label>Branch</label>
                <input
                  type="text"
                  value={profile.bankAccount?.branch || ""}
                  onChange={(e) =>
                    handleChange("bankAccount.branch", e.target.value)
                  }
                  disabled={!editMode}
                />
              </div>

              <div className="formGroup">
                <label>Account Number <span style={{color: '#ef4444'}}>*</span></label>
                <input
                  type="text"
                  value={profile.bankAccount?.accountNumber || ""}
                  onChange={(e) =>
                    handleChange("bankAccount.accountNumber", e.target.value)
                  }
                  disabled={!editMode}
                  style={{
                    borderColor: errors["bankAccount.accountNumber"] ? '#ef4444' : '',
                    backgroundColor: errors["bankAccount.accountNumber"] ? '#fef2f2' : ''
                  }}
                />
                {errors["bankAccount.accountNumber"] && (
                  <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["bankAccount.accountNumber"]}</span>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="rightColumn">
            <div className="sectionCard">
              <h3>📞 Contact Details</h3>
              <div className="formGrid">
                <div className="formGroup">
                  <label>Email (Login) <span style={{color: '#ef4444'}}>*</span></label>
                  <input
                    type="email"
                    value={profile.contactDetails?.email || ""}
                    onChange={(e) =>
                      handleChange("contactDetails.email", e.target.value)
                    }
                    disabled={!editMode}
                    style={{
                      borderColor: errors["contactDetails.email"] ? '#ef4444' : '',
                      backgroundColor: errors["contactDetails.email"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["contactDetails.email"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["contactDetails.email"]}</span>
                  )}
                </div>

                <div className="formGroup">
                  <label>Phone <span style={{color: '#ef4444'}}>*</span></label>
                  <input
                    type="text"
                    value={profile.contactDetails?.phone || ""}
                    onChange={(e) =>
                      handleChange(
                        "contactDetails.phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    disabled={!editMode}
                    maxLength={10}
                    style={{
                      borderColor: errors["contactDetails.phone"] ? '#ef4444' : '',
                      backgroundColor: errors["contactDetails.phone"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["contactDetails.phone"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["contactDetails.phone"]}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="sectionCard">
              <h3>👤 Contact Person</h3>
              <div className="formGrid">
                <div className="formGroup">
                  <label>Name <span style={{color: '#ef4444'}}>*</span></label>
                  <input
                    type="text"
                    value={profile.contactPerson?.name || ""}
                    onChange={(e) =>
                      handleChange("contactPerson.name", e.target.value)
                    }
                    disabled={!editMode}
                    style={{
                      borderColor: errors["contactPerson.name"] ? '#ef4444' : '',
                      backgroundColor: errors["contactPerson.name"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["contactPerson.name"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["contactPerson.name"]}</span>
                  )}
                </div>

                <div className="formGroup">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={profile.contactPerson?.designation || ""}
                    onChange={(e) =>
                      handleChange("contactPerson.designation", e.target.value)
                    }
                    disabled={!editMode}
                  />
                </div>

                <div className="formGroup">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={profile.contactPerson?.phone || ""}
                    onChange={(e) =>
                      handleChange(
                        "contactPerson.phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    disabled={!editMode}
                    maxLength={10}
                    style={{
                      borderColor: errors["contactPerson.phone"] ? '#ef4444' : '',
                      backgroundColor: errors["contactPerson.phone"] ? '#fef2f2' : ''
                    }}
                  />
                  {errors["contactPerson.phone"] && (
                    <span className="error" style={{color: '#ef4444', fontSize: '12px'}}>{errors["contactPerson.phone"]}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="btnRow">
          {!editMode ? (
            <button className="btn-edit" onClick={() => setEditMode(true)}>
              <FiEdit /> Edit Profile
            </button>
          ) : (
            <>
              <button className="btn-save" onClick={handleSave}>
                <FiSave /> Save Changes
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setProfile(JSON.parse(JSON.stringify(originalProfile)));
                  setEditMode(false);
                  toast.info("Changes reverted.");
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .supProfileWrapper {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          min-height: 100vh;
          padding: 20px 60px;
          color: #fff;
          display: flex;
          justify-content: center;
        }
        .profileContainer {
          width: 100%;
          max-width: 1300px;
          background: rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 25px 40px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
        }
        .headerRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .title {
          font-size: 26px;
          font-weight: bold;
          color: #fbbf24;
        }
        .backBtn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          transition: color 0.3s ease;
        }
        .backBtn:hover {
          color: #fbbf24;
        }
        .sectionGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        @media (max-width: 950px) {
          .sectionGrid { grid-template-columns: 1fr; }
        }
        .sectionCard {
          background: rgba(255,255,255,0.08);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 25px;
        }
        .sectionCard h3 {
          color: #fbbf24;
          font-size: 18px;
          margin-bottom: 12px;
        }
        .formGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
        }
        .formGroup label {
          display: block;
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 6px;
        }
        .formGroup input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: #fff;
          outline: none;
        }
        .error {
          color: #f87171;
          font-size: 13px;
          margin-top: 4px;
          display: block;
        }
        .btnRow {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
        }
        .btn-edit, .btn-save, .btn-cancel {
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          color: #fff;
          font-size: 15px;
        }
        .btn-edit { background: #3b82f6; }
        .btn-save { background: #22c55e; }
        .btn-cancel { background: #ef4444; }
      `}</style>
    </div>
  );
}
