import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="notebook-bg flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
