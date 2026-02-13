import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex items-center justify-center pt-40 pb-16">
            <SignUp />
        </div>
    );
}
