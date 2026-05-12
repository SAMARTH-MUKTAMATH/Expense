const AuthLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen flex justify-center items-center pt-8 pb-12 px-4 overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-[#89E900]/15 blur-3xl animate-float-slow" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#89E900]/10 blur-3xl animate-float" />
            </div>
            {children}
        </div>
    );
};

export default AuthLayout;
