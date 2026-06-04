import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-charcoal p-6">
      <SignIn appearance={{ elements: { card: "bg-charcoal hairline" } }} />
    </main>
  );
}
