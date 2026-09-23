import { useSubject } from "@/lib/subject";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DEFAULT_SUBJECT, isSubjectKey } from "@/lib/subject";

export const Route = createFileRoute("/_authenticated/$subject")({
  beforeLoad: ({ params }) => {
    if (!isSubjectKey(params.subject)) {
      throw redirect({
        to: "/$subject/dashboard",
        params: { subject: DEFAULT_SUBJECT },
        replace: true,
      });
    }
  },
  component: () => <Outlet />,
});
