export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1c26] px-4 sm:px-6">
      <div className="w-full max-w-[95%] sm:max-w-lg p-4 sm:p-10 space-y-6 sm:space-y-8 flex flex-col items-center">
        <div className="text-center w-full">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FFFFFF] mb-2 sm:mb-3">Welcome Back</h2>
          <p className="text-base sm:text-lg md:text-xl text-[#fff]">Please wait while we load...</p>
        </div>
        <div className="w-full max-w-[100%] sm:max-w-none">
          <div className="bg-[#0b1c26] border-none shadow-none rounded-none p-0 w-full min-w-0">
            <div className="animate-pulse space-y-6">
              <div className="h-12 sm:h-14 bg-[#1c3441] rounded-lg w-full"></div>
              <div className="h-12 sm:h-14 bg-[#1c3441] rounded-lg w-full"></div>
              <div className="h-12 sm:h-14 bg-[#14404e] rounded-lg w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 