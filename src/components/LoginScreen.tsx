import React, { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/UserSlice";
export function LoginScreen() {
    const [mobile, setMobile] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [forgotPin, setForgotPin] = useState(false);
    const [email, setEmail] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isPinLoading, setIsPinLoading] = useState(false);

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
         console.log("Login will POST to:", axiosInstance.defaults.baseURL + "/auth/login");

        if (pin.length !== 6 || mobile.length < 10) return;
        setIsLoading(true);

        try {
            const { data } = await axiosInstance.post("/auth/login", {
                mobile,
                pin,
            });

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
            toast.error(
                err?.response?.data?.message || "Failed to login. Try again."
            );
            setPin("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendNewPin = async (e: any) => {
        console.log("Login will POST to:", axiosInstance.defaults.baseURL + "/auth/login");
        e.preventDefault();
        if (!email) return toast.error("Please enter your email.");
        if (mobile.length !== 10)
            return toast.error("Enter a valid 10-digit mobile.");
        setIsPinLoading(true);

        try {
            await axiosInstance.post("/auth/forgot-pin", { email, mobile });
            toast.success("A new PIN has been sent to your email.");
        } catch (error:any) {
            if (error.response?.status === 404) {
                toast.error(
                    error.response.data?.message || "Resource not found"
                );
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setIsPinLoading(false);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full sm:max-w-md mx-2 sm:mx-4">
                {!forgotPin ? (
                    <>
                        {/* Login Form */}
                        <div className="text-center mb-6">
                            <img
                                src="/images/century.png"
                                alt="Century Logo"
                                className="mx-auto w-20 h-20 object-contain mb-2"
                            />
                            <h1
                                className="text-xl sm:text-2xl font-bold mb-1"
                                style={{
                                    color: "var(--special-color, #311b92)",
                                }}
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
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                    className="w-full h-12 text-center tracking-widest text-lg"
                                />
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                <Label
                                    htmlFor="rememberMe"
                                    className="text-gray-700 font-medium text-sm sm:text-base"
                                >
                                    Remember Me
                                </Label>
                            </div>

                            <Button
                                onClick={handleLogin}
                                disabled={
                                    pin.length !== 6 ||
                                    mobile.length < 10 ||
                                    isLoginLoading
                                }
                                className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor:
                                        pin.length === 6 &&
                                        mobile.length >= 10 &&
                                        !isLoginLoading
                                            ? "var(--special-color, #311b92)"
                                            : "var(--disabled-color, #9ca3af)",
                                }}
                            >
                                {isLoginLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>

                            <div className="text-center mt-2">
                                <Button
                                    variant="link"
                                    onClick={() => setForgotPin(true)}
                                    className="text-sm text-red-600 hover:underline font-semibold"
                                >
                                    Forgot PIN?
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Forgot PIN Form */}
                        <div className="text-center mb-6">
                            <h1
                                className="text-xl sm:text-2xl font-bold mb-2"
                                style={{ color: "#FF3F33" }}
                            >
                                Forgot PIN
                            </h1>
                        </div>

                        <form onSubmit={handleSendNewPin} className="space-y-5">
                            {/* Email */}
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 text-base"
                                />
                            </div>

                            {/* Mobile */}
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="forgotMobile">
                                    Mobile Number
                                </Label>
                                <Input
                                    id="forgotMobile"
                                    type="text"
                                    placeholder="Enter your 10-digit mobile number"
                                    value={mobile}
                                    onChange={handleMobileChange}
                                    maxLength={10}
                                    required
                                    className="h-12 text-base"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
                                disabled={
                                    isPinLoading ||
                                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                                    mobile.length !== 10
                                }
                                style={{
                                    backgroundColor: "#FF3F33",
                                    opacity:
                                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                            email
                                        ) ||
                                        mobile.length !== 10 ||
                                        isPinLoading
                                            ? 0.5
                                            : 1,
                                }}
                            >
                                {isPinLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    "Send New PIN"
                                )}
                            </Button>
                        </form>

                        <Button
                            onClick={() => setForgotPin(false)}
                            className="w-full mt-4 flex items-center justify-center space-x-2 font-semibold"
                            style={{ color: "#FF3F33" }}
                            variant="ghost"
                        >
                            <ArrowLeft className="w-4 h-4" stroke="#FF3F33" />
                            <span>Back to Login</span>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
