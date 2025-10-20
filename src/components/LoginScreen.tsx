import React, { useState } from "react";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/UserSlice";
import { motion } from "framer-motion";

export function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPin(e.target.value.replace(/\D/g, "").slice(0, 6));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobile.length >= 10 && pin.length === 6) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 6 || mobile.length < 10) return;
    setIsLoginLoading(true);

    try {
      const { data } = await axiosInstance.post("/auth/login", { mobile, pin });

      if (data.success) {
        if (rememberMe) {
          localStorage.setItem(
            "kpiUser",
            JSON.stringify({ role: data.role, mobile })
          );
        }
        dispatch(setUser(data.user));
        toast.success(`Welcome, ${data.role}!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to login. Try again.");
      setPin("");
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full sm:max-w-md mx-2 sm:mx-4">
        <div className="text-center mb-6">
          <img
            src="/images/century.png"
            alt="Century Logo"
            className="mx-auto w-20 h-20 object-contain mb-2"
          />
          <h1
            className="text-xl sm:text-2xl font-bold mb-1"
            style={{ color: "var(--special-color, #311b92)" }}
          >
            Century Fashion City
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Enter your mobile and 6-digit PIN
          </p>
        </div>

        <div className="space-y-5">
          {/* Mobile Number */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="text"
              placeholder="Enter your 10-digit mobile number"
              value={mobile}
              onChange={handleMobileChange}
              maxLength={10}
              disabled={isLoginLoading}
              className="w-full h-12 text-base"
            />
          </div>

          {/* PIN */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="pin">6-Digit PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="• • • • • •"
              value={pin}
              onChange={handlePinChange}
              onKeyDown={handleKeyDown}
              maxLength={6}
              disabled={isLoginLoading}
              className="w-full h-12 text-center tracking-widest text-lg"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4"
            />
            <Label
              htmlFor="rememberMe"
              className="text-gray-700 font-medium text-sm sm:text-base"
            >
              Remember Me
            </Label>
          </div>

          {/* Motion Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={pin.length !== 6 || mobile.length < 10 || isLoginLoading}
            className={`w-full h-12 text-base font-semibold flex items-center justify-center gap-2 rounded-md relative overflow-hidden ${
              pin.length === 6 && mobile.length >= 10 && !isLoginLoading
                ? "bg-[var(--special-color,#311b92)] text-white"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            {isLoginLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
