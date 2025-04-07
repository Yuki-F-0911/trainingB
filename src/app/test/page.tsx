"use client";

export default function TestPage() {
    // Get current date and time for visual confirmation
    const currentTime = new Date().toLocaleString();
  
    return (
      <div className="min-h-[300px] bg-lime-200 p-8 border-4 border-dashed border-purple-600 rounded-lg flex flex-col items-center justify-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 animate-pulse">
          ✅ Test Page Deployed Successfully!
        </h1>
        <p className="text-lg text-teal-800 text-center mb-2">
          If you see this lime green background with a dashed purple border and pulsing blue text,
          <br />
          then Vercel deployments are reflecting basic code changes.
        </p>
        <p className="text-sm text-gray-600 mt-4">
          Page Rendered At: {currentTime}
        </p>
      </div>
    );
  } 