"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, verifyOtp, regis, OtpRegis, LoginGoogle } from "@/utils/auth";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  TxtField,
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
  SelectLabel,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from ".";

export function LoginRegisModalForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [email_or_phone, setEmailOrPhone] = useState("");
  const [step, setStep] = useState("login"); // login | otp | regis | otpregis
  const [email, setEmail] = useState("");
  const [phone_number, SetPhoneNumber] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pwError, setPwError] = useState("");
  const [message, setMessage] = useState("");

  function validatePasswords(pw, cpw) {
    if (!pw || !cpw) return "";
    if (pw.length < 8) return "Password minimal 8 karakter";
    if (pw !== cpw) return "Password dan konfirmasi tidak sama";
    return "";
  }

  const handleRegis = async () => {
    setLoading(true);
    try {
      const data = await regis(
        email,
        phone_number,
        first_name,
        last_name,
        gender,
        password
      );
      if (data.serve) {
        setMessage("OTP dikirim ke email kamu");
        setStep("otpregis");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

 const handleOtpRegis = async () => {
  setLoading(true);
  try {
    const data = await OtpRegis(email, phone_number, first_name, last_name, gender, password, otp);

 if (data.success) {
     setMessage("Register berhasil!");     router.push("/dashboard");
   } else {
     setMessage("OTP salah, coba lagi.");
   }

   const token = data?.serve?.token;
   const user = data?.serve?.data;
   if (token && user) {
     login({ user, token });
     setMessage("Register berhasil!");
     router.push("/account/profile");
   } else {
     setMessage(data?.message || "Register gagal.");
   }

  } catch (err) {
    setMessage(err.message);
  } finally {
    setLoading(false);
  }
};


  const handleSuccess = async (credentialResponse) => {
  try {
    // Ambil token dari Google
    const token = credentialResponse.credential;
    console.log("Google token received:", token);

    // Panggil LoginGoogle dari utils/auth
    const data = await LoginGoogle(token);

    console.log("LoginGoogle response:", data);
    login({ user: data.serve.data, token: data.serve.token }); // pastikan token yang benar
    setMessage("Login berhasil!");
  } catch (err) {
    console.error("Login Google error:", err.message);
    setMessage("Login Google gagal.");
  }
};

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await loginUser(email_or_phone, password);
      if (data.serve) {
        setMessage("OTP dikirim ke email kamu");
        setStep("otp");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setLoading(true);
    try {
      const data = await verifyOtp(
        email,
        phone_number,
        first_name,
        last_name,
        otp,
        gender,
        password
      );
      if (data.success) {
        setMessage("Login berhasil!");
        router.push("/dashboard"); // ✅
      } else {
        setMessage("OTP salah, coba lagi.");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false); // ✅ add finally
    }
  };

  // If you use @react-oauth/google's <GoogleLogin />, you don't need the window.google init.
  // Remove the effect below to avoid double-initializing GSI (which can also cause odd dev-time warnings).
  // useEffect(() => { ... }, []);

  return (
    <Dialog className="Form-Sign-in">
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">Sign in</Button>
      </DialogTrigger>

      <DialogContent>
        {/* ✅ Put header pieces *inside* DialogHeader.
            Keep DialogDescription TEXT-ONLY (or use asChild with a block wrapper). */}
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {/* ✅ All complex layout/content lives OUTSIDE DialogDescription to avoid <div> inside <p>. */}
        <Tabs
        className="py-6"
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setStep(v === "signin" ? "login" : "regis");
            setMessage("");
          }}
        >
          <TabsList className="absolute left-6 top-4 w-fit">
            <TabsTrigger value="signin" className="w-1/2">Sign in</TabsTrigger>
            <TabsTrigger value="signup" className="w-1/2">Sign up</TabsTrigger>
          </TabsList>

          {/* -------- SIGN IN -------- */}
          <TabsContent value="signin">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                if (step === "login") handleLogin();
                else if (step === "otp") handleOtpVerify();
              }}
            >
              <div className="space-y-4">
                <div className="w-full flex mx-auto justify-center">
                  <img
                    src="/logo-abby-combine.svg"
                    alt="logo"
                    className="w-[120px] h-auto"
                  />
                </div>

                <div className="space-y-0 text-center">
                  <div className="text-base flex justify-center items-center">
                    Hi{" "}
                    <span className="font-damion px-2 text-2xl text-primary-700 font-normal">
                      Abeauties
                    </span>
                    Welcome back! 👋
                  </div>
                  <div className="text-sm text-neutral-500">
                    Log in to unlock your personalized beauty space.
                  </div>
                </div>
              </div>

              {step === "login" ? (
                <div className="space-y-3">
                  <TxtField
                    autoComplete="email"
                    inputMode="email"
                    pattern="[^@\s]+@[^@\s]+\.[^@\s]+|[0-9]*"
                    placeholder="Email or Phone number"
                    variant="outline"
                    size="sm"
                    value={email_or_phone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                  />
                  <TxtField
                    autoComplete="current-password"
                    type="password"
                    placeholder="Password"
                    variant="outline"
                    size="sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : (
                <TxtField
                  autoComplete="one-time-code"
                  placeholder="Masukkan OTP"
                  variant="outline"
                  size="sm"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}

              <div className="w-full">
                {step === "login" && (
                  <Link href="#" className="text-xs">
                    Forgot password?
                  </Link>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : step === "login" ? "Sign in" : "Verify OTP"}
                </Button>

                {step === "login" && (
                  <>
                    <div className="w-full flex justify-center text-sm">Or</div>
                    <div className="flex flex-col gap-4">
                      <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => alert("Login gagal")}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* If you keep this custom div, it’s fine—just don’t place it inside DialogDescription */}
              {/* <div><div id="googleLoginDiv" /></div> */}
            </form>
          </TabsContent>

          {/* -------- SIGN UP -------- */}
          <TabsContent value="signup">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                if (step === "regis") handleRegis();
                else if (step === "otpregis") handleOtpRegis();
              }}
            >
              <div className="space-y-4">
                <div className="w-full flex mx-auto justify-center">
                  <img
                    src="/logo-abby-combine.svg"
                    alt="logo"
                    className="w-[120px] h-auto"
                  />
                </div>

                <div className="space-y-0 text-center">
                  <div className="text-base">Ready to Glow up ✨ with us?</div>
                  <div className="text-neutral-500 text-sm">
                    Explore skincare tips & talk, all in one place
                  </div>
                </div>
              </div>

              {step === "regis" && (
                <div className="space-y-3">
                  <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4">
                    <TxtField
                      className="w-full"
                      autoComplete="given-name"
                      placeholder="First name"
                      variant="outline"
                      size="sm"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <TxtField
                      className="w-full"
                      autoComplete="family-name"
                      placeholder="Last name"
                      variant="outline"
                      size="sm"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <TxtField
                    autoComplete="email"
                    inputMode="email"
                    pattern="[^@\s]+@[^@\s]+\.[^@\s]+|[0-9]*"
                    placeholder="Enter your email"
                    variant="outline"
                    size="sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TxtField
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Phone number"
                    variant="outline"
                    size="sm"
                    value={phone_number}
                    onChange={(e) => SetPhoneNumber(e.target.value)}
                  />

                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Gender</SelectLabel>
                        <SelectItem value="1">Male</SelectItem>
                        <SelectItem value="2">Female</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <TxtField
                    autoComplete="new-password"
                    type="password"
                    placeholder="Password"
                    variant="outline"
                    size="sm"
                    value={password}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPassword(v);
                      setPwError(validatePasswords(v, confirm_password));
                    }}
                  />
                  <TxtField
                    autoComplete="new-password"
                    type="password"
                    placeholder="Confirm password"
                    variant="outline"
                    size="sm"
                    value={confirm_password}
                    onChange={(e) => {
                      const v = e.target.value;
                      setConfirmPassword(v);
                      setPwError(validatePasswords(password, v));
                    }}
                  />
                  {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                </div>
              )}

              {step === "otpregis" && (
                <div className="space-y-3">
                  <TxtField
                    autoComplete="one-time-code"
                    placeholder="Masukkan OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : step === "regis" ? "Sign Up" : "Verify OTP"}
                </Button>
              </div>

              {message && (
                <span className="block text-sm text-center text-neutral-600 mt-2">
                  {message}
                </span>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
