import dynamic from "next/dynamic";

const HomeComponent = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Home() {
  return <HomeComponent />;
}
