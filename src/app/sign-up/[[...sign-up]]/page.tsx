import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="notebook-bg flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
