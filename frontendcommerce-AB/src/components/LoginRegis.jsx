"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, regis, OtpRegis, LoginGoogle } from "@/services/auth";
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

const pickValue = (e) => e?.target?.value ?? e ?? "";

export function LoginRegisModalForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ===== SIGN IN =====
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ===== SIGN UP =====
  const [signupStep, setSignupStep] = useState("regis"); // regis | otpregis
  const [email, setEmail] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [gender, setGender] = useState(""); // "1" | "2"
  const [regPassword, setRegPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pwError, setPwError] = useState("");

  function validateRegisterPassword(pw, cpw) {
    if (!pw || !cpw) return "";
    if (pw.length < 8) return "Password minimal 8 karakter";
    // wajib ada simbol termasuk underscore (match backend)
    if (!/[^A-Za-z0-9\s]/.test(pw)) return "Password wajib mengandung minimal 1 simbol (contoh: ! @ _)";
    if (pw !== cpw) return "Password dan konfirmasi tidak sama";
    return "";
  }

  // ===== HANDLERS =====
  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await loginUser(loginId, loginPassword);

      const token = data?.serve?.token;
      const user = data?.serve?.data;

      if (token && user) {
        login({ user, token });
        router.push("/account/profile");
        return;
      }

      setMessage(data?.message || "Login gagal.");
    } catch (err) {
      setMessage(err?.message || "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegis = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await regis(
        email,
        phone_number,
        first_name,
        last_name,
        gender,
        regPassword
      );

      if (data?.serve) {
        setMessage("OTP dikirim, cek email/whatsapp kamu.");
        setSignupStep("otpregis");
        return;
      }

      setMessage(data?.message || "Gagal mengirim OTP.");
    } catch (err) {
      setMessage(err?.message || "Gagal register.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRegis = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await OtpRegis(
        email,
        phone_number,
        first_name,
        last_name,
        gender,
        regPassword,
        otp
      );

      const token = data?.serve?.token;
      const user = data?.serve?.data;

      if (token && user) {
        login({ user, token });
        router.push("/account/profile");
        return;
      }

      setMessage(data?.message || "OTP salah / register gagal.");
    } catch (err) {
      setMessage(err?.message || "OTP salah / register gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessGoogle = async (credentialResponse) => {
    try {
      setMessage("");
      const token = credentialResponse?.credential;
      if (!token) return setMessage("Login Google gagal (token kosong).");

      const data = await LoginGoogle(token);
      const user = data?.serve?.data;
      const accessToken = data?.serve?.token;

      if (user && accessToken) {
        login({ user, token: accessToken });
        router.push("/account/profile");
        return;
      }

      setMessage(data?.message || "Login Google gagal.");
    } catch (err) {
      setMessage(err?.message || "Login Google gagal.");
    }
  };

  return (
    <Dialog className="Form-Sign-in">
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          Masuk
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Tabs
          className="py-6"
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setMessage("");
            setLoading(false);

            if (v === "signup") {
              setSignupStep("regis");
              setOtp("");
              setPwError("");
            }
          }}
        >
          <TabsList className="absolute left-6 top-4 w-fit">
            <TabsTrigger value="signin" className="w-1/2">
              Masuk
            </TabsTrigger>
            <TabsTrigger value="signup" className="w-1/2">
              Daftar
            </TabsTrigger>
          </TabsList>

          {/* ===== SIGN IN ===== */}
          <TabsContent value="signin">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                handleLogin();
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
                    Welcome back! 
                  </div>
                  <div className="text-sm text-neutral-500">
                    Log in to unlock your personalized beauty space.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <TxtField
                  type="text"
                  autoComplete="username"
                  inputMode="text"
                  placeholder="Email or Phone number"
                  variant="outline"
                  size="sm"
                  value={loginId}
                  onChange={(e) => setLoginId(pickValue(e))}
                />

                <TxtField
                  autoComplete="current-password"
                  type="password"
                  placeholder="Password"
                  variant="outline"
                  size="sm"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(pickValue(e))}
                />
              </div>

              <div className="w-full">
                <Link href="#" className="text-xs">
                  Forgot password?
                </Link>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Sign in"}
                </Button>

                <div className="w-full flex justify-center text-sm">Or</div>
                <div className="flex flex-col gap-4">
                  <GoogleLogin
                    onSuccess={handleSuccessGoogle}
                    onError={() => setMessage("Login Google gagal")}
                  />
                </div>
              </div>

              {message && (
                <span className="block text-sm text-center text-neutral-600 mt-2">
                  {message}
                </span>
              )}
            </form>
          </TabsContent>

          {/* ===== SIGN UP ===== */}
          <TabsContent value="signup">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                if (signupStep === "regis") handleRegis();
                else handleOtpRegis();
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

              {signupStep === "regis" && (
                <div className="space-y-3">
                  <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4">
                    <TxtField
                      className="w-full"
                      autoComplete="given-name"
                      placeholder="First name"
                      variant="outline"
                      size="sm"
                      value={first_name}
                      onChange={(e) => setFirstName(pickValue(e))}
                    />
                    <TxtField
                      className="w-full"
                      autoComplete="family-name"
                      placeholder="Last name"
                      variant="outline"
                      size="sm"
                      value={last_name}
                      onChange={(e) => setLastName(pickValue(e))}
                    />
                  </div>

                  {/*  EMAIL REGISTER (bukan email_or_phone) */}
                  <TxtField
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Enter your email"
                    variant="outline"
                    size="sm"
                    value={email}
                    onChange={(e) => setEmail(pickValue(e))}
                  />

                  <TxtField
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Phone number"
                    variant="outline"
                    size="sm"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(pickValue(e))}
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
                    value={regPassword}
                    onChange={(e) => {
                      const v = pickValue(e);
                      setRegPassword(v);
                      setPwError(validateRegisterPassword(v, confirm_password));
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
                      const v = pickValue(e);
                      setConfirmPassword(v);
                      setPwError(validateRegisterPassword(regPassword, v));
                    }}
                  />

                  {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                </div>
              )}

              {signupStep === "otpregis" && (
                <div className="space-y-3">
                  <TxtField
                    autoComplete="one-time-code"
                    placeholder="Masukkan OTP"
                    value={otp}
                    onChange={(e) => setOtp(pickValue(e))}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={loading || (signupStep === "regis" && !!pwError)}
                >
                  {loading ? "Loading..." : signupStep === "regis" ? "Sign Up" : "Verify OTP"}
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
