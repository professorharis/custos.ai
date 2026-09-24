import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Server component — its only job is to provide the <Suspense> boundary
// that `useSearchParams()` (inside <LoginForm />) requires. Because this
// outer component never touches the query string itself, Next.js can
// statically prerender this shell at build time; the client-only part
// is filled in after hydration.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

// Static skeleton shown for the brief moment between "HTML arrived" and
// "client component hydrated". It intentionally reads NO query params and
// uses NO hooks — that's what keeps it prerenderable.
function LoginPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:flex w-[460px] flex-shrink-0 bg-blue-600" />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-[400px] w-full animate-pulse">
          <div className="h-8 w-40 bg-slate-200 rounded mb-4" />
          <div className="h-5 w-56 bg-slate-100 rounded mb-8" />
          <div className="h-12 bg-slate-100 rounded-xl mb-5" />
          <div className="h-4 w-full bg-slate-100 rounded mb-4" />
          <div className="h-12 bg-slate-100 rounded-xl mb-3" />
          <div className="h-12 bg-slate-100 rounded-xl mb-3" />
          <div className="h-12 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </main>
  );
}