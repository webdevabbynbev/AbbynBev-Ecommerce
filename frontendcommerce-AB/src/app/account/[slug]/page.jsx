import { Profilepage } from "../profile";


export default async function Page(props) {
  const params = await props.params;
  const { slug } = params;

  switch (slug) {
    case "profile":
      return <Profilepage />;
    default:
      return <div>Page not found</div>;
  }
}
