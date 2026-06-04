import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-charcoal p-6">
      <SignUp appearance={{ elements: { card: "bg-charcoal hairline" } }} />
    </main>
  );
}
