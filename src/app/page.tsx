import ApplicationForm from "@/components/ApplicationForm";

export default function Home() {
  return (
    <main className="p-10 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-xl overflow-hidden">
        <header className="bg-blue-900 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">Enterprise ISP Application</h1>
          <p className="text-blue-200 mt-2">Secure Application Portal</p>
        </header>
        <ApplicationForm />
      </div>
    </main>
  );
}
