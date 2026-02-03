import { useState } from "react";
import { Label } from "../components/ui/Label.jsx";
import { Input } from "../components/ui/Input.jsx";
import { cn } from "../lib/utils.js";  
import { useNavigate } from "react-router-dom";

export function Signin() {
  const [loading, setLoading] = useState(false);
    const navigate=useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent multiple clicks
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const res = await fetch("http://localhost:1400/api/user/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      navigate('/');
    } catch (err) {
      console.error("Signup error:", err);
      alert(`Signup failed.${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-black h-screen flex items-center justify-center">
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 text-center">
          Signin to EduAid 
        </h2>
        <form className="my-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" placeholder="projectmayhem@fc.com" type="email" required />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input id="password" placeholder="••••••••" type="password" required />
          </LabelInputContainer>

          <button
            disabled={loading}
            className={cn(
              "group/btn relative block h-10 w-full rounded-md font-medium text-white",
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-br from-black to-neutral-600 shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800"
            )}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in →"}
            {!loading && <BottomGradient />}
          </button>
        </form>
      </div>
    </div>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>
    {children}
  </div>
);
