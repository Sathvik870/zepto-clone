import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import { useAlert } from "../../context/common/AlertContext";
import { useDebounce } from "use-debounce";
import api from "../../api";
import {
  registerForPushNotifications,
  unsubscribeFromPushNotifications,
} from "../../utils/pushManager";
import {
  HiCheckCircle,
  HiExclamation,
  HiOutlineRefresh,
  HiArrowLeft,
} from "react-icons/hi";

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const ProfilePage: React.FC = () => {
  const { customer, login } = useCustomerAuth();
  const { showAlert } = useAlert();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [debouncedUsername] = useDebounce(formData.username, 500);

  useEffect(() => {
    if (customer) {
      const profileData = {
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        gender: customer.gender || "",
        username: customer.username || "",
        email: customer.email || "",
        phone_number: customer.phone_number || "",
        address: customer.address || "",
        landmark: customer.landmark || "",
        city: customer.city || "",
        state: customer.state || "",
      };
      setFormData(profileData);
      setInitialData(profileData);
    }
  }, [customer]);

  useEffect(() => {
    const checkSubscription = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
      }
      setIsPushLoading(false);
    };
    checkSubscription();
  }, []);

  useEffect(() => {
    if (
      isEditing &&
      debouncedUsername &&
      debouncedUsername !== initialData.username
    ) {
      const check = async () => {
        setUsernameStatus("checking");
        try {
          const { data } = await api.post(
            "/api/customer/users/check-username",
            { username: debouncedUsername }
          );
          setUsernameStatus(data.available ? "available" : "taken");
        } catch (error) {
          console.error("Username check failed:", error);
          setUsernameStatus("idle");
        }
      };
      check();
    } else {
      setUsernameStatus("idle");
    }
  }, [debouncedUsername, initialData.username, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePushToggle = async () => {
    setIsPushLoading(true);
    if (isPushEnabled) {
      const success = await unsubscribeFromPushNotifications('customer');
      if (success) {
        setIsPushEnabled(false);
      } else {
        console.error("Failed to disable push notifications.");
      }
    } else {
      const success = await registerForPushNotifications("customer");
      if (success) {
        console.log("Push notifications enabled.");
        setIsPushEnabled(true);
      } else {
        console.error("Failed to enable push notifications.");
      }
    }
    setIsPushLoading(false);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || usernameStatus === "taken") return;
    try {
      await api.put("/api/customer/users/profile", formData);
      showAlert("Profile updated successfully!", "success");
      const token = localStorage.getItem("customerAuthToken");
      if (token) {
        await login(token);
      }
      setIsEditing(false);
    } catch (error: any) {
      showAlert(
        error.response?.data?.message || "Failed to update profile.",
        "error"
      );
    }
  };

  if (!customer) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const baseInputStyle =
    "w-full p-3 bg-gray-100 border border-transparent rounded-lg transition-colors duration-200";
  const enabledInputStyle =
    "focus:outline-none focus:ring-2 focus:ring-[#387c40] focus:bg-white";
  const disabledInputStyle = "text-gray-700 bg-gray-100 cursor-default";

  return (
    <div className="bg-gray-50 min-h-full p-4 sm:p-6 md:p-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg"
      >
        <div className="relative flex justify-center items-center mb-8">
          <Link
            to="/"
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to Home"
          >
            <HiArrowLeft size={24} />
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm hover:bg-green-200 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-gray-700 border-b-2 border-[#144a31] pb-1 mb-2">
              Identifiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField label="Customer Code">
                <input
                  type="text"
                  value={customer.customer_code}
                  disabled
                  className={`${baseInputStyle} ${disabledInputStyle}`}
                />
              </FormField>
              <FormField label="Username">
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`${baseInputStyle} ${
                      isEditing ? enabledInputStyle : disabledInputStyle
                    }`}
                  />
                  {isEditing && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <HiOutlineRefresh className="animate-spin text-gray-400" />
                      )}
                      {usernameStatus === "available" && (
                        <HiCheckCircle className="text-green-500" />
                      )}
                      {usernameStatus === "taken" && (
                        <HiExclamation className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-700 border-b-2 border-[#144a31] pb-1 mb-2">
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField label="First Name">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                  required
                />
              </FormField>
              <FormField label="Last Name">
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                />
              </FormField>
              <FormField label="Email Address">
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                  required
                />
              </FormField>
              <FormField label="Phone Number">
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                />
              </FormField>
              <FormField label="Gender">
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-700 border-b-2 border-[#144a31] pb-1 mb-2">
              Address Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <FormField label="Full Address">
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={3}
                    className={`${baseInputStyle} ${
                      isEditing ? enabledInputStyle : disabledInputStyle
                    }`}
                  />
                </FormField>
              </div>
              <FormField label="Landmark (Optional)">
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                />
              </FormField>
              <FormField label="City">
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                />
              </FormField>
              <FormField label="State">
                <input
                  type="text"
                  name="state"
                  value={formData.state || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${baseInputStyle} ${
                    isEditing ? enabledInputStyle : disabledInputStyle
                  }`}
                />
              </FormField>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
              Notifications
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  Order Status Updates
                </p>
                <p className="text-sm text-gray-500">
                  Receive alerts even when the app is in the background.
                </p>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={isPushLoading}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 ${
                  isPushEnabled ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Toggle Push Notifications</span>
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                    isPushEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>
        {isEditing && hasChanges && (
          <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={usernameStatus === "taken"}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
