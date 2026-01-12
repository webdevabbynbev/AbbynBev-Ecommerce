import { Profilepage } from "../profile";


export default function Page({ params }) {
  const { slug } = params;

  switch (slug) {
    case "profile":
      return <Profilepage />;
    default:
      return <div>Page not found</div>;
  }
}
