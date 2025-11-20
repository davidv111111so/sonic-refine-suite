import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Music, Lock, Mail, User, Chrome } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { z } from "zod";
const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  fullName: z.string().trim().min(2, "Full name is required"),
});
const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});
export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [introOpacity, setIntroOpacity] = useState(1);
  const [isSignUp, setIsSignUp] = useState(false);

  // Handle password reset from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const accessToken = params.get("access_token");
    const type = params.get("type");

    // Check if this is a password reset callback
    if (mode === "reset" || (type === "recovery" && accessToken)) {
      setShowUpdatePassword(true);
      setShowResetPassword(false);
      setIsSignUp(false);
      setShowIntro(false);
    }
  }, []);

  // Handle intro animation timing
  useEffect(() => {
    // After 5 seconds, start fading out
    const fadeTimer = setTimeout(() => {
      setIntroOpacity(0);
    }, 5000);

    // After 6 seconds (5s display + 1s fade), remove intro completely
    const removeTimer = setTimeout(() => {
      setShowIntro(false);
    }, 6000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);
  useEffect(() => {
    // Check for dev bypass first
    if (localStorage.getItem("dev_bypass") === "true") {
      console.log("Dev bypass active: Skipping beta check");
      navigate("/");
      return;
    }

    // BETA CHECK DISABLED FOR LOCAL DEVELOPMENT
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Beta user - allow access (beta check disabled)
        navigate("/");

        /* ORIGINAL BETA CHECK - COMMENTED OUT FOR LOCAL DEV
        // Check if user is in beta whitelist
        const { data: isBetaUser, error } = await supabase.rpc("is_beta_user", {
          _user_id: session.user.id,
        });
        if (error || !isBetaUser) {
          // Not in beta whitelist - sign out
          await supabase.auth.signOut();
          toast.error("Access Restricted", {
            description:
              "This app is currently in beta testing. Access is limited to authorized users only.",
          });
          return;
        }

        // Beta user - allow access
        navigate("/");
        */
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Beta user - allow access (beta check disabled)
        navigate("/");

        /* ORIGINAL BETA CHECK - COMMENTED OUT FOR LOCAL DEV
        // Check if user is in beta whitelist
        const { data: isBetaUser, error } = await supabase.rpc("is_beta_user", {
          _user_id: session.user.id,
        });
        if (error || !isBetaUser) {
          // Not in beta whitelist - sign out and show error
          await supabase.auth.signOut();
          toast.error("Access Restricted", {
            description:
              "This app is currently in beta testing. Access is limited to authorized users only.",
          });
          return;
        }

        // Beta user - redirect to home page
        navigate("/");
        */
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = signUpSchema.safeParse({
        email,
        password,
        fullName,
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: result.data.fullName,
          },
        },
      });
      if (error) throw error;
      toast.success(
        "Account created! Please check your email to confirm your account before logging in."
      );
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error creating account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = signInSchema.safeParse({
        email,
        password,
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });
      if (error) throw error;
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error signing in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error signing in with Google";
      toast.error(message);
    }
  };
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = resetPasswordSchema.safeParse({
        email: resetEmail,
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(
        result.data.email,
        {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        }
      );
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setResetEmail("");
      setShowResetPassword(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error sending reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setShowUpdatePassword(false);
      navigate("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error updating password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/* Intro Animation */}
      {showIntro && (
        <div
          className="fixed inset-0 z-50 transition-opacity duration-1000"
          style={{
            opacity: introOpacity,
          }}
        >
          <ShaderAnimation />
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 text-center text-8xl font-extrabold tracking-tighter whitespace-pre-wrap bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            style={{
              fontFamily:
                "'Orbitron', 'Exo 2', 'Rajdhani', 'Audiowide', monospace",
              textShadow:
                "0 0 40px rgba(6, 182, 212, 0.6), 0 0 80px rgba(59, 130, 246, 0.4)",
              letterSpacing: "0.15em",
            }}
          >
            LEVEL
          </span>
        </div>
      )}

      {/* Auth Page */}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/90 border-slate-700">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full">
                <Music className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Level Audio
            </CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to enhance your audio files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showUpdatePassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            ) : !showResetPassword ? (
              <>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-white">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot password?
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full bg-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-slate-900 px-2 text-stone-950 font-extrabold">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="w-full border-slate-700 bg-white hover:bg-gray-100 text-gray-900"
                      >
                        <Chrome className="mr-2 h-4 w-4" />
                        <span className="font-medium">Sign in with Google</span>
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full bg-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-slate-900 px-2 text-slate-400">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white border-slate-700 text-gray-900 hover:bg-gray-100"
                      >
                        <Chrome className="mr-2 h-4 w-4" />
                        <span className="font-medium">Sign up with Google</span>
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    We'll send you a link to reset your password
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetPassword(false)}
                  className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
